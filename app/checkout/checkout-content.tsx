"use client"
// deploy
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  CreditCard,
  MapPin,
  Truck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Wallet,
  QrCode,
  Banknote,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { formatCurrency, calcularDistanciaKm, calcularTaxaEntrega, buscarCoordenadasPorEndereco, RESTAURANTE_COORDS } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, doc, updateDoc, getDoc } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define validation schema
const checkoutSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  paymentMethod: z.enum(["pix", "credit", "cash"]),
  name: z.string().min(3, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().min(10, "Número de telefone inválido").optional(),
  streetName: z.string().optional(),
  postalCode: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  referencePoint: z.string().optional(),
  saveAddress: z.boolean().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().min(1, "Escolha o dia da entrega"),
  scheduledTime: z.string().min(1, "Escolha o horário da entrega"),
}).refine((data) => {
  // Se for entrega, os campos de endereço são obrigatórios
  if (data.deliveryMethod === "delivery") {
    return data.streetName && data.postalCode && data.number;
  }
  // Se for retirada, os campos de endereço não são necessários
  return true;
}, {
  message: "Para entrega, preencha todos os campos de endereço obrigatórios",
  path: ["streetName"] // Mostra o erro no campo streetName
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export default function CheckoutContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cart, clearCart } = useCart()
  const { user, isAuthenticated, addresses, addAddress } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [isPixPaid, setIsPixPaid] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [currentOrderDocId, setCurrentOrderDocId] = useState<string | null>(null)
  const [addressChanged, setAddressChanged] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [deliveryFee, setDeliveryFee] = useState(8.0)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [calculandoEntrega, setCalculandoEntrega] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastAddressRef = useRef("")

  // Utilidades para datas
  const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  function getNextWeekdayDate(weekday: number) {
    const today = new Date();
    const result = new Date(today);
    result.setDate(today.getDate() + ((7 + weekday - today.getDay()) % 7 || 7));
    return result;
  }
  const terca = getNextWeekdayDate(2); // 2 = terça
  const quarta = getNextWeekdayDate(3); // 3 = quarta
  const tercaStr = terca.toLocaleDateString('pt-BR');
  const quartaStr = quarta.toLocaleDateString('pt-BR');
  const hoje = new Date();
  const isHojeTercaOuQuarta = hoje.getDay() === 2 || hoje.getDay() === 3;

  // Initialize form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: "delivery",
      paymentMethod: "pix",
      name: "",
      email: "",
      phone: "",
      streetName: "",
      postalCode: "",
      number: "",
      complement: "",
      referencePoint: "",
      saveAddress: false,
      notes: "",
      scheduledDate: isHojeTercaOuQuarta ? hoje.toLocaleDateString('pt-BR') : tercaStr,
      scheduledTime: "",
    },
  })

  // Watch delivery method to conditionally show address field
  const deliveryMethod = form.watch("deliveryMethod")
  const paymentMethod = form.watch("paymentMethod")
  const scheduledDate = form.watch("scheduledDate")
  const scheduledTime = form.watch("scheduledTime")

  // Redirect if cart is empty
  useEffect(() => {
    setMounted(true)
  }, [])

  // Não redirecionar mais para login se não estiver autenticado
  // Apenas verificar se está autenticado para pré-preencher dados
  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      // Preencher o formulário com os dados do usuário se estiver autenticado
      form.setValue("name", user.name || "")
      form.setValue("email", user.email || "")
      form.setValue("phone", user.phone || "")
    } else {
      // Clear saved addresses if user logs out
      // setSavedAddresses([]);
    }
  }, [isAuthenticated, user, mounted, form])

  // Poll Mercado Pago for payment status when paymentId is set
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (paymentId) {
      console.log('🚀 Iniciando verificação de pagamento:', paymentId);
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/mercadopago/status?id=${paymentId}`);
          const data = await response.json();

          if (response.ok) {
            if (data.status === 'approved') {
              console.log('🎉 Pagamento aprovado! Atualizando pedido...');
              // Payment confirmed - Update order status in Firestore
              try {
                if (currentOrderDocId) {
                  const orderRef = doc(db, "orders", currentOrderDocId);
                  const updateData = {
                    status: "pending",
                    payment: {
                      status: "paid",
                      approvedAt: new Date().toISOString(),
                      total: data.transaction_details?.total_paid_amount,
                      paymentId: paymentId,
                      paymentMethod: data.payment_method_id,
                      transactionId: data.transaction_details?.transaction_id
                    },
                    statusHistory: {
                      pending: {
                        timestamp: new Date(),
                        note: "Pagamento aprovado, pedido confirmado"
                      }
                    }
                  };
                  await updateDoc(orderRef, updateData);
                  console.log('✅ Pedido atualizado com sucesso!');
                  // Buscar dados completos do pedido para enviar emails
                  const orderDoc = await getDoc(orderRef);
                  if (orderDoc.exists()) {
                    const orderData = orderDoc.data();
                    // Enviar emails de confirmação
                    try {
                      // 1. Email para o cliente
                      if (orderData.user?.email) {
                        const clientEmailResponse = await fetch('/api/send-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            to: orderData.user.email,
                            subject: `🎉 Pedido #${orderData.id} Pago - Aguardando Confirmação`,
                            html: `
                              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f8fafc;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                  <h1 style="color: #059669; margin: 0;">PEDIDO PAGO!</h1>
                                  <p style="color: #059669; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${orderData.id}</p>
                                </div>
                                <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 20px;">
                                  <h2 style="color: #1e293b; margin-top: 0;">✅ Pagamento Confirmado</h2>
                                  <p style="font-size: 16px; color: #374151;">Seu pagamento foi confirmado com sucesso!</p>
                                </div>
                                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                  <h3 style="color: #1e293b; margin-top: 0;">📋 Seu Pedido:</h3>
                                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                                    <ul style="list-style: none; padding: 0; margin: 0;">
                                      ${orderData.items.map((item: any) => `
                                        <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                                          <span><strong>${item.quantity}x</strong> ${item.name}</span>
                                          <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                                        </li>
                                      `).join('')}
                                    </ul>
                                  </div>
                                </div>
                                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                  <h3 style="color: #166534; margin-top: 0;">📅 Entrega Agendada</h3>
                                  <p style="font-size: 16px; color: #166534; margin: 0;">
                                    <strong>Data:</strong> ${orderData.scheduledDate}<br/>
                                    <strong>Horário:</strong> ${orderData.scheduledTime}
                                  </p>
                                </div>
                                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                  <h3 style="color: #1e293b; margin-top: 0;">💰 Informações de Pagamento:</h3>
                                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                      <strong>Total:</strong> R$ ${orderData.payment.total.toFixed(2)}
                                    </div>
                                    <div>
                                      <strong>Método:</strong> PIX
                                    </div>
                                    <div>
                                      <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAGO</span>
                                    </div>
                                    <div>
                                      <strong>Entrega:</strong> ${orderData.type === 'delivery' ? 'Entrega' : 'Retirada'}
                                    </div>
                                  </div>
                                </div>
                                ${orderData.notes ? `
                                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                    <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                                    <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${orderData.notes}</p>
                                  </div>
                                ` : ''}
                                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
                                  <h3 style="color: #92400e; margin-top: 0;">⏳ AGUARDANDO CONFIRMAÇÃO</h3>
                                  <p style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0;">
                                    Seu pedido está aguardando o restaurante aceitar!
                                  </p>
                                  <p style="color: #92400e; font-size: 14px; margin: 5px 0 0 0;">
                                    Você receberá uma notificação assim que o pedido for aceito e começar a ser preparado.
                                  </p>
                                </div>
                                <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                                  <p>Agradecemos a preferência!</p>
                                  <p><strong>Nossa Cozinha</strong></p>
                                </div>
                              </div>
                            `
                          }),
                        });
                        if (!clientEmailResponse.ok) {
                          console.error('Erro ao enviar email para cliente');
                        }
                      }
                      // 2. Email para o restaurante
                      const restaurantEmailResponse = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          to: 'nossacozinhajp@gmail.com',
                          subject: `🚨 PEDIDO PAGO - #${orderData.id} - PREPARAR IMEDIATAMENTE`,
                          html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #fef2f2;">
                              <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #dc2626; margin: 0;">🚨 PEDIDO PAGO!</h1>
                                <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${orderData.id}</p>
                                <p style="color: #dc2626; font-size: 16px; margin: 5px 0;">PREPARAR IMEDIATAMENTE</p>
                              </div>
                              <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
                                <h2 style="color: #1e293b; margin-top: 0;">✅ Pagamento Confirmado</h2>
                                <p style="font-size: 16px; color: #374151;">O pagamento do pedido foi confirmado e está pronto para preparo!</p>
                              </div>
                              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #1e293b; margin-top: 0;">📋 Detalhes do Pedido:</h3>
                                <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                                  <ul style="list-style: none; padding: 0; margin: 0;">
                                    ${orderData.items.map((item: any) => `
                                      <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                                        <span><strong>${item.quantity}x</strong> ${item.name}</span>
                                        <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                                      </li>
                                    `).join('')}
                                  </ul>
                                </div>
                              </div>
                              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #166534; margin-top: 0;">📅 Entrega Agendada</h3>
                                <p style="font-size: 16px; color: #166534; margin: 0;">
                                  <strong>Data:</strong> ${orderData.scheduledDate}<br/>
                                  <strong>Horário:</strong> ${orderData.scheduledTime}
                                </p>
                              </div>
                              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #1e293b; margin-top: 0;">💰 Informações de Pagamento:</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                  <div>
                                    <strong>Total:</strong> R$ ${orderData.payment.total.toFixed(2)}
                                  </div>
                                  <div>
                                    <strong>Método:</strong> PIX
                                  </div>
                                  <div>
                                    <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAGO</span>
                                  </div>
                                  <div>
                                    <strong>Entrega:</strong> ${orderData.type === 'delivery' ? 'Entrega' : 'Retirada'}
                                  </div>
                                </div>
                              </div>
                              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #1e293b; margin-top: 0;">👤 Cliente:</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                  <div>
                                    <strong>Nome:</strong> ${orderData.user.name}
                                  </div>
                                  <div>
                                    <strong>Telefone:</strong> ${orderData.user.phone}
                                  </div>
                                  ${orderData.type === 'delivery' && orderData.delivery.address ? `
                                    <div style="grid-column: 1 / -1;">
                                      <strong>Endereço:</strong> ${orderData.delivery.address}
                                    </div>
                                  ` : ''}
                                </div>
                              </div>
                              ${orderData.notes ? `
                                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                  <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                                  <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${orderData.notes}</p>
                                </div>
                              ` : ''}
                              <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                                <h3 style="color: #1e40af; margin-top: 0;">🚀 AÇÃO NECESSÁRIA</h3>
                                <p style="color: #1e40af; font-size: 16px; font-weight: bold; margin: 0;">
                                  O pedido está pronto para ser preparado!
                                </p>
                                <p style="color: #1e40af; font-size: 14px; margin: 5px 0 0 0;">
                                  Tempo estimado: ${orderData.type === 'delivery' ? '45 minutos' : '30 minutos'}
                                </p>
                              </div>
                              <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                                <p><strong>Nossa Cozinha - Sistema de Pedidos</strong></p>
                              </div>
                            </div>
                          `
                        }),
                      });
                      if (!restaurantEmailResponse.ok) {
                        console.error('Erro ao enviar email para restaurante');
                      }
                    } catch (emailError) {
                      console.error('❌ Erro ao enviar emails:', emailError);
                    }
                  }
                } else {
                  console.error('❌ ID do pedido não encontrado');
                }
              } catch (updateError) {
                console.error('❌ Erro ao atualizar pedido:', updateError);
              }
              // Stop polling and redirect
              clearInterval(intervalId!);
              setPixQrCode(null);
              setPixCode(null);
              setPaymentId(null);
              setCurrentOrderDocId(null);
              setIsPixPaid(true);
              clearCart();
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pedido foi recebido e está sendo preparado.",
                variant: "success"
              });
              router.push("/pedido-confirmado");
            } else if (data.status === 'rejected' || data.status === 'cancelled') {
              console.log('❌ Pagamento rejeitado:', data.status);
              // Payment failed or cancelled
              clearInterval(intervalId!);
              setPixQrCode(null);
              setPixCode(null);
              setPaymentId(null);
              setCurrentOrderDocId(null);
              toast({
                title: "Pagamento não aprovado",
                description: "O pagamento foi rejeitado ou cancelado. Tente novamente.",
                variant: "destructive"
              });
            }
            // Keep polling for other statuses (pending, in_process, etc.)
          } else {
            console.error('❌ Erro ao verificar status:', data);
          }
        } catch (error) {
          console.error('❌ Erro na verificação de pagamento:', error);
        }
      }, 15000); // Poll every 15 seconds
    }
    // Cleanup interval on component unmount or when paymentId changes to null
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentId, currentOrderDocId, router, clearCart, toast]);

  // Função para gerar novo QR Code PIX para pedido existente
  const generateNewPixForOrder = async (orderDocId: string) => {
    try {
      setErrorMsg(null)
      console.log('🔄 Gerando novo PIX para pedido:', orderDocId)
      const orderRef = doc(db, 'orders', orderDocId)
      const orderDoc = await getDoc(orderRef)
      if (!orderDoc.exists()) {
        setErrorMsg('Pedido não encontrado. Verifique o link ou tente novamente.')
        toast({
          title: "Erro",
          description: "Pedido não encontrado.",
          variant: "destructive"
        })
        setIsProcessingOrder(false)
        return
      }
      const orderData = orderDoc.data()
      if (orderData.status !== 'payment_pending') {
        setErrorMsg('Este pedido não está mais pendente de pagamento.')
        toast({
          title: "Erro",
          description: "Este pedido não está mais pendente de pagamento.",
          variant: "destructive"
        })
        setIsProcessingOrder(false)
        return
      }
      // Gerar novo QR Code PIX
      const response = await fetch('/api/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: orderData.payment.total,
          description: `Pedido ${orderData.id} - ${format(new Date(orderData.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
          orderId: orderData.id
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        setErrorMsg(errorData.error || 'Erro ao gerar PIX. Tente novamente.')
        throw new Error(errorData.error || 'Erro ao gerar PIX')
      }
      const data = await response.json()
      if (!data.qr_code || !data.qr_code_base64) {
        setErrorMsg('QR Code não encontrado na resposta. Tente novamente.')
        throw new Error('QR Code não encontrado na resposta')
      }
      setPixQrCode(data.qr_code_base64)
      setPixCode(data.qr_code)
      setPaymentId(data.id)
      setCurrentOrderDocId(orderDocId)
      setIsProcessingOrder(false)
      setErrorMsg(null)
      console.log('✅ Novo QR Code PIX gerado com sucesso')
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Não foi possível gerar o novo PIX. Tente novamente.")
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o novo PIX. Tente novamente.",
        variant: "destructive"
      })
      setIsProcessingOrder(false)
    }
  }

  // Verificar pedido na URL ao montar o componente
  useEffect(() => {
    if (!mounted) return
    const orderDocId = searchParams.get('orderId')?.trim()
    if (orderDocId) {
      setIsProcessingOrder(true)
      generateNewPixForOrder(orderDocId)
    }
  }, [mounted, searchParams])

  // Atualiza taxa de entrega automaticamente ao preencher endereço (com debounce)
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    debounceTimeout.current = setTimeout(async () => {
      if (deliveryMethod !== "delivery") {
        setDeliveryFee(0)
        setDeliveryError(null)
        return
      }
      const street = form.getValues("streetName")
      const number = form.getValues("number")
      const cidade = "João Pessoa"
      const uf = "PB"
      if (!street || !number) {
        setDeliveryFee(8.0)
        setDeliveryError(null)
        return
      }
      const enderecoCompleto = `${street}, ${number}, ${cidade}, ${uf}`
      if (enderecoCompleto === lastAddressRef.current) return
      setCalculandoEntrega(true)
      setDeliveryError(null)
      lastAddressRef.current = enderecoCompleto
      const coords = await buscarCoordenadasPorEndereco(enderecoCompleto)
      if (!coords) {
        setDeliveryFee(8.0)
        setDeliveryError("Não foi possível localizar o endereço. Verifique se está correto.")
      } else {
        const distancia = calcularDistanciaKm(RESTAURANTE_COORDS.lat, RESTAURANTE_COORDS.lon, coords.lat, coords.lon)
        const taxa = calcularTaxaEntrega(distancia)
        if (taxa === null) {
          setDeliveryFee(0)
          setDeliveryError("Endereço fora da área de entrega (máx. 10km do restaurante)")
        } else {
          setDeliveryFee(taxa)
          setDeliveryError(null)
        }
      }
      setCalculandoEntrega(false)
    }, 700)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryMethod, form.watch("streetName"), form.watch("number")])

  // Handle form submission
  async function onSubmit(values: CheckoutFormValues) {
    setIsSubmitting(true)
    setIsProcessingOrder(true)
    try {
      // Validar campos obrigatórios para usuários não autenticados
      if (!isAuthenticated) {
        if (!values.name || !values.phone) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha seu nome e telefone para continuar.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }
      // Validar campos de endereço para entrega
      if (values.deliveryMethod === "delivery") {
        if (!values.streetName || !values.postalCode || !values.number) {
          toast({
            title: "Endereço incompleto",
            description: "Por favor, preencha os campos obrigatórios do endereço.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }
      // Save address if authenticated, delivery is selected, and saveAddress is checked
      if (isAuthenticated && user?.id && values.deliveryMethod === "delivery" && values.saveAddress) {
        try {
          const userRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const addresses = userData.addresses || [];
            addresses.push({
              street: values.streetName,
              zipcode: values.postalCode,
              number: values.number,
              complement: values.complement || '',
              neighborhood: values.referencePoint || '',
              city: '',
              state: '',
              nickname: 'Endereço de Entrega'
            });
            await updateDoc(userRef, {
              addresses: addresses
            });
          }
        } catch (error) {
          toast({
            title: "Erro ao salvar endereço",
            description: "Não foi possível salvar o endereço para uso futuro.",
            variant: "destructive",
          });
        }
      }
      // Garantir data e horário válidos
      let scheduledDate = values.scheduledDate;
      let scheduledTime = values.scheduledTime;
      const horarios = ["10h - 12h", "12h - 14h", "14h - 17h"];
      function getNextWeekdayDate(weekday: number) {
        const today = new Date();
        const result = new Date(today);
        result.setDate(today.getDate() + ((7 + weekday - today.getDay()) % 7 || 7));
        return result;
      }
      const hoje = new Date();
      const isHojeTercaOuQuarta = hoje.getDay() === 2 || hoje.getDay() === 3;
      if (!scheduledDate) {
        if (isHojeTercaOuQuarta) {
          scheduledDate = hoje.toLocaleDateString('pt-BR');
        } else {
          const terca = getNextWeekdayDate(2);
          scheduledDate = terca.toLocaleDateString('pt-BR');
        }
      }
      if (!scheduledTime) {
        // Se for hoje, pega o próximo horário disponível
        if (isHojeTercaOuQuarta) {
          const horaAtual = hoje.getHours();
          if (horaAtual < 10) scheduledTime = horarios[0];
          else if (horaAtual < 12) scheduledTime = horarios[1];
          else if (horaAtual < 14) scheduledTime = horarios[2];
          else scheduledTime = horarios[0]; // Se já passou de todos, agenda para o próximo horário do próximo dia
        } else {
          scheduledTime = horarios[0];
        }
      }
      // 1. Primeiro criar o pedido no Firestore
      const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const orderRef = collection(db, 'orders');
      const orderData = {
        id: orderId,
        userId: isAuthenticated ? user?.id : null,
        user: {
          name: isAuthenticated ? user?.name : values.name,
          phone: isAuthenticated ? user?.phone : values.phone,
          email: isAuthenticated ? user?.email : values.email
        },
        type: values.deliveryMethod,
        status: 'payment_pending',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          options: item.options || {}
        })),
        delivery: {
          address: values.deliveryMethod === 'delivery' ? 
            `${values.streetName}, ${values.number}${values.complement ? ` - ${values.complement}` : ''}` : 
            null,
          time: values.deliveryMethod === 'delivery' ? '45 minutos' : '30 minutos'
        },
        payment: {
          method: values.paymentMethod,
          total: total,
          status: 'pending'
        },
        notes: values.notes || '',
        scheduledDate,
        scheduledTime,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        statusHistory: {
          payment_pending: {
            timestamp: serverTimestamp(),
            note: 'Pedido criado, aguardando pagamento'
          }
        }
      };
      const newOrderRef = await addDoc(orderRef, orderData);
      // 2. Depois gerar o pagamento PIX
      const pixPayload = {
        amount: Number(total.toFixed(2)),
        description: `Pedido Nossa Cozinha - ${new Date().toLocaleDateString()}`,
        orderId: orderId
      }
      const pixResponse = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pixPayload),
      })
      const paymentData = await pixResponse.json()
      if (!pixResponse.ok) {
        toast({
          title: "Erro ao gerar pagamento PIX",
          description: paymentData.details || paymentData.error || "Tente novamente.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setIsProcessingOrder(false)
        return
      }
      if (!paymentData.qr_code || !paymentData.qr_code_base64) {
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível gerar o QR Code PIX. Tente novamente.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setIsProcessingOrder(false)
        return
      }
      setPixQrCode(paymentData.qr_code_base64)
      setPixCode(paymentData.qr_code)
      setPaymentId(paymentData.id)
      setCurrentOrderDocId(newOrderRef.id)
      setIsProcessingOrder(false)
      setIsSubmitting(false)
      toast({
        title: "QR Code PIX gerado",
        description: "Escaneie o QR Code ou copie o código para pagar.",
        variant: "success"
      })
    } catch (error) {
      setIsProcessingOrder(false)
      setIsSubmitting(false)
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-3xl pt-28">
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <h2 className="text-2xl font-light">QR Code PIX sendo gerado...</h2>
          </div>
        </div>
      </div>
    )
  }

  // Se não há itens no carrinho mas há um orderId, mostrar loading ou erro
  if (cart.length === 0 && searchParams.get('orderId')) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-6xl mt-20 relative z-20">
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Pagamento Pendente</h1>
          <p className="text-neutral-500">Complete o pagamento do seu pedido.</p>
        </div>
        {/* Loading ou erro do QR Code */}
        {isProcessingOrder ? (
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <h2 className="text-2xl font-light">QR Code PIX sendo gerado...</h2>
              <p className="text-neutral-500">Por favor, aguarde enquanto geramos o QR Code para pagamento.</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="bg-white border border-red-200 rounded-sm overflow-hidden shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <h2 className="text-2xl font-light text-red-600">Erro ao buscar pedido</h2>
              <p className="text-neutral-500">{errorMsg}</p>
              <Button onClick={() => window.location.href = '/checkout'}>Voltar para o checkout</Button>
            </div>
          </div>
        ) : null}
        {/* Modal do QR Code */}
        {pixQrCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex flex-col items-center justify-center text-center space-y-6">
                <h2 className="text-2xl font-medium">Pague com PIX</h2>
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img 
                    src={`data:image/png;base64,${pixQrCode}`} 
                    alt="QR Code PIX" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="w-full space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Código PIX (copie e cole)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm break-all bg-white p-2 rounded border flex-1">{pixCode}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(pixCode || '')
                          toast({
                            title: "Código copiado!",
                            description: "Cole no seu aplicativo do banco.",
                          })
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-600">
                    <p>1. Abra o app do seu banco</p>
                    <p>2. Escaneie o QR Code ou cole o código</p>
                    <p>3. Confirme as informações e pague</p>
                    <p>4. A tela fechará automaticamente após a confirmação</p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        setPixQrCode(null)
                        setPixCode(null)
                        setPaymentId(null)
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Checkout normal
  const subtotal = cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0)
  const total = subtotal + (deliveryMethod === "delivery" ? deliveryFee : 0)

  // Horários disponíveis
  const horarios = [
    "10h - 12h",
    "12h - 14h",
    "14h - 17h"
  ];

  // Aviso se não for terça ou quarta
  const showAgendamentoAviso = !isHojeTercaOuQuarta;

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl mt-20 relative z-20">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Finalizar Pedido</h1>
        <p className="text-neutral-500">Revise seu pedido e escolha as opções de entrega e pagamento.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm sticky top-28">
            <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-neutral-200">
              <h2 className="text-xl font-medium">Resumo do Pedido</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {item.quantity || 1}x {item.name}
                      </p>
                      {item.options && Object.entries(item.options).map(([key, value]) => (
                        <p key={key} className="text-sm text-neutral-500">
                          {key}: {value}
                        </p>
                      ))}
                    </div>
                    <p className="font-medium">{formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>{formatCurrency(subtotal)}</p>
                </div>
                <div className="flex justify-between">
                  <p>Taxa de entrega</p>
                  <p>{deliveryMethod === "delivery" ? (calculandoEntrega ? "Calculando..." : `+${formatCurrency(deliveryFee)}`) : "Grátis"}</p>
                </div>
                {deliveryError && (
                  <div className="text-sm text-red-600 mt-2">{deliveryError}</div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <p>Total</p>
                  <p>{formatCurrency(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Checkout Form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Delivery Method */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" /> Método de Entrega
                    </h3>
                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              <div className="border rounded-sm p-4 cursor-pointer hover:border-primary transition-colors">
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="delivery" />
                                  </FormControl>
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="font-medium flex items-center justify-between">
                                      <span className="flex items-center gap-2">
                                        <Truck className="h-4 w-4" /> Entrega
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {deliveryMethod === "delivery" ? (calculandoEntrega ? "Calculando..." : `+${formatCurrency(deliveryFee)}`) : "Grátis"}
                                      </Badge>
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">
                                      Receba seu pedido em casa em até 45 minutos
                                    </p>
                                  </div>
                                </FormItem>
                              </div>
                              <div className="border rounded-sm p-4 cursor-pointer hover:border-primary transition-colors">
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="pickup" />
                                  </FormControl>
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="font-medium flex items-center justify-between">
                                      <span className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Retirada
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        Grátis
                                      </Badge>
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">
                                      Retire seu pedido em nossa loja em 30 minutos
                                    </p>
                                  </div>
                                </FormItem>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Informações do Cliente */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Informações de Contato
                    </h3>
                    {isAuthenticated ? (
                      <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm mb-4">
                        <p className="text-sm text-neutral-600">
                          Pedido para: <span className="font-medium">{user?.name}</span>
                        </p>
                        {user?.phone && <p className="text-sm text-neutral-600">Telefone: {user.phone}</p>}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu nome completo" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input placeholder="seu@email.com" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 00000-0000" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  {/* Address (only for delivery) */}
                  {deliveryMethod === "delivery" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> Endereço de Entrega
                      </h3>
                      {isAuthenticated && addresses.length > 0 && (
                        <div className="mb-4">
                          <FormLabel>Endereços Salvos</FormLabel>
                          <Select onValueChange={(value) => {
                            const selectedAddress = addresses.find(addr => addr.id === value);
                            if (selectedAddress) {
                              form.setValue("streetName", selectedAddress.street || "");
                              form.setValue("postalCode", selectedAddress.zipcode || "");
                              form.setValue("number", selectedAddress.number || "");
                              form.setValue("complement", selectedAddress.complement || "");
                              form.setValue("referencePoint", selectedAddress.neighborhood || "");
                              setAddressChanged(prev => prev + 1); // força re-render
                            }
                          }} value={form.getValues("streetName") ? "custom" : ""}  >
                            <SelectTrigger className="rounded-none">
                              <SelectValue placeholder="Selecione um endereço salvo" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="custom">Inserir novo endereço</SelectItem>
                              {addresses.map(address => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.street}, {address.number} - {address.neighborhood}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="streetName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Rua</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Rua das Flores" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: 123" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Apto 101, Bloco B" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="referencePoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ponto de Referência</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Próximo ao supermercado" className="rounded-none" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name="saveAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="cursor-pointer">Salvar endereço</FormLabel>
                                <p className="text-sm text-neutral-500">Salvar este endereço para futuros pedidos</p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  {/* Payment Method */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" /> Método de Pagamento
                    </h3>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                              <div className="border rounded-sm p-4 cursor-pointer hover:border-primary transition-colors">
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="pix" />
                                  </FormControl>
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="font-medium flex items-center gap-2">
                                      <QrCode className="h-4 w-4" /> PIX
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">Pagamento instantâneo</p>
                                  </div>
                                </FormItem>
                              </div>
                              <div className="border rounded-sm p-4 cursor-pointer hover:border-primary transition-colors opacity-60">
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="credit" disabled />
                                  </FormControl>
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="font-medium flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" /> Cartão
                                      <Badge className="ml-1 bg-neutral-200 text-neutral-700 hover:bg-neutral-200">
                                        Em breve
                                      </Badge>
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">Crédito ou débito</p>
                                  </div>
                                </FormItem>
                              </div>
                              <div className="border rounded-sm p-4 cursor-pointer hover:border-primary transition-colors opacity-60">
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="cash" disabled />
                                  </FormControl>
                                  <div className="space-y-1 flex-1">
                                    <FormLabel className="font-medium flex items-center gap-2">
                                      <Banknote className="h-4 w-4" /> Dinheiro
                                      <Badge className="ml-1 bg-neutral-200 text-neutral-700 hover:bg-neutral-200">
                                        Em breve
                                      </Badge>
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">Pagamento na entrega</p>
                                  </div>
                                </FormItem>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Payment Instructions for PIX */}
                  {paymentMethod === "pix" && (
                    <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-primary" /> Instruções para Pagamento PIX
                      </h4>
                      <p className="text-sm text-neutral-600 mb-4">
                        Após confirmar o pedido, você receberá um QR Code PIX para realizar o pagamento. O pedido será
                        preparado assim que o pagamento for confirmado.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="h-4 w-4" /> Pagamento instantâneo e seguro
                      </div>
                    </div>
                  )}
                  {/* Additional Notes */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Observações Adicionais
                    </h3>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Alguma observação especial para o seu pedido? (opcional)"
                              className="resize-none rounded-none"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* AVISO DE AGENDAMENTO */}
                  {showAgendamentoAviso && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-6 rounded">
                      <strong>Agendamento obrigatório:</strong> Só entregamos às <b>terças</b> e <b>quartas-feiras</b>.<br/>
                      Seu pedido será agendado para o próximo dia disponível.
                    </div>
                  )}
                  {/* CAMPOS DE AGENDAMENTO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da entrega</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha o dia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={tercaStr}>Terça-feira ({tercaStr})</SelectItem>
                              <SelectItem value={quartaStr}>Quarta-feira ({quartaStr})</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário da entrega</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha o horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {horarios.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full rounded-none bg-primary text-white hover:bg-primary/90"
                    disabled={isSubmitting || (deliveryMethod === "delivery" && (!form.getValues("streetName") || !form.getValues("postalCode") || !form.getValues("number")))}
                    key={addressChanged}
                  >
                    {isSubmitting ? (
                      "Processando..."
                    ) : (
                      <>
                        Finalizar Pedido <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
      {pixQrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <h2 className="text-2xl font-medium">Pague com PIX</h2>
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <img 
                  src={`data:image/png;base64,${pixQrCode}`} 
                  alt="QR Code PIX" 
                  className="w-64 h-64"
                />
              </div>
              <div className="w-full space-y-4">
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Código PIX (copie e cole)</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm break-all bg-white p-2 rounded border flex-1">{pixCode}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(pixCode || '')
                        toast({
                          title: "Código copiado!",
                          description: "Cole no seu aplicativo do banco.",
                        })
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p>1. Abra o app do seu banco</p>
                  <p>2. Escaneie o QR Code ou cole o código</p>
                  <p>3. Confirme as informações e pague</p>
                  <p>4. A tela fechará automaticamente após a confirmação</p>
                </div>
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setPixQrCode(null)
                      setPixCode(null)
                      setPaymentId(null)
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
