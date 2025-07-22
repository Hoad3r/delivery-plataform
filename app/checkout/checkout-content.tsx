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
import { collection, addDoc, serverTimestamp, getDocs, query, doc, updateDoc, getDoc, where, onSnapshot, doc as firestoreDoc } from "firebase/firestore"
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
  const [deliveryFee, setDeliveryFee] = useState(6.0)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [calculandoEntrega, setCalculandoEntrega] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastAddressRef = useRef("")
  const [cupom, setCupom] = useState<string>("");
  const [cupomInfo, setCupomInfo] = useState<any>(null);
  const [cupomErro, setCupomErro] = useState<string | null>(null);
  const [cupomValidando, setCupomValidando] = useState(false);

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

  // Função para diminuir o estoque dos pratos
  const decreaseStockForOrder = async (orderItems: any[]) => {
    try {
      console.log('📦 Diminuindo estoque para os itens do pedido...');
      
      for (const item of orderItems) {
        // Buscar o prato no Firestore pelo ID
        const dishesRef = collection(db, "dishes");
        const q = query(dishesRef, where("id", "==", item.id));
        const dishSnapshot = await getDocs(q);
        
        if (!dishSnapshot.empty) {
          const dishDoc = dishSnapshot.docs[0];
          const dishData = dishDoc.data();
          const currentStock = dishData.availableQuantity || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          // Atualizar o estoque
          await updateDoc(firestoreDoc(db, "dishes", dishDoc.id), {
            availableQuantity: newStock,
            // Se o estoque chegou a 0, marcar como indisponível
            isAvailable: newStock > 0
          });
          
          console.log(`✅ Estoque atualizado para ${item.name}: ${currentStock} → ${newStock}`);
          
          // Se o estoque chegou a 0, mostrar alerta
          if (newStock === 0) {
            console.log(`⚠️ Estoque esgotado para ${item.name}`);
          }
        } else {
          console.warn(`⚠️ Prato não encontrado: ${item.name} (ID: ${item.id})`);
        }
      }
      
      console.log('✅ Estoque atualizado com sucesso para todos os itens!');
    } catch (error) {
      console.error('❌ Erro ao atualizar estoque:', error);
      throw error;
    }
  };

  // Remover o polling para /api/mercadopago/status
  // Substituir por escuta do pedido no Firestore
  useEffect(() => {
    if (!currentOrderDocId) return;
    const orderRef = firestoreDoc(db, "orders", currentOrderDocId);
    const unsubscribe = onSnapshot(orderRef, (orderDoc) => {
                  if (orderDoc.exists()) {
                    const orderData = orderDoc.data();
        // Quando o status mudar para 'pending' (ou 'confirmado'), finalize o fluxo
        if (orderData.status === "pending" || orderData.status === "confirmado") {
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
        }
        // Tratar rejeição/cancelamento
        if (orderData.payment?.status === "rejected" || orderData.payment?.status === "cancelled") {
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
      }
    });
    return () => unsubscribe();
  }, [currentOrderDocId, clearCart, toast, router]);

  // Função para gerar novo QR Code PIX para pedido existente
  const generateNewPixForOrder = async (orderDocId: string) => {
    try {
      setErrorMsg(null)
      console.log('🔄 Gerando novo PIX para pedido:', orderDocId)
      const orderRef = firestoreDoc(db, 'orders', orderDocId)
      const orderDoc = await getDoc(orderRef);
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
        setDeliveryFee(6.0)
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
        setDeliveryFee(6.0)
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
        if (!values.name || !values.phone || !values.email) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha seu nome, telefone e email para continuar.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }
      
      // Verificar disponibilidade de estoque antes de processar o pedido
      try {
        console.log('🔍 Verificando disponibilidade de estoque...');
        const dishesRef = collection(db, "dishes");
        
        for (const cartItem of cart) {
          const q = query(dishesRef, where("id", "==", cartItem.id));
          const dishSnapshot = await getDocs(q);
          
          if (!dishSnapshot.empty) {
            const dishData = dishSnapshot.docs[0].data();
            const availableStock = dishData.availableQuantity || 0;
            const requestedQuantity = cartItem.quantity || 1;
            
            if (availableStock < requestedQuantity) {
              toast({
                title: "Estoque insuficiente",
                description: `Desculpe, não há estoque suficiente para ${cartItem.name}. Disponível: ${availableStock}, Solicitado: ${requestedQuantity}`,
                variant: "destructive",
              });
              setIsSubmitting(false);
              setIsProcessingOrder(false);
              return;
            }
          } else {
            toast({
              title: "Produto não encontrado",
              description: `O produto ${cartItem.name} não foi encontrado no sistema.`,
              variant: "destructive",
            });
            setIsSubmitting(false);
            setIsProcessingOrder(false);
            return;
          }
        }
        console.log('✅ Estoque verificado com sucesso!');
      } catch (stockError) {
        console.error('❌ Erro ao verificar estoque:', stockError);
        toast({
          title: "Erro ao verificar estoque",
          description: "Não foi possível verificar a disponibilidade dos produtos. Tente novamente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        setIsProcessingOrder(false);
        return;
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
          const userRef = firestoreDoc(db, 'users', user.id);
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
      // Cálculo do subtotal, taxa de entrega e total com cupom
      const subtotal = cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0)
      let descontoCupom = 0;
      let deliveryFeeTotal = deliveryMethod === "delivery" ? deliveryFee : 0;
      if (cupomInfo) {
        if (cupomInfo.tipo === "desconto" && cupomInfo.valor) {
          descontoCupom = Math.min(Number(cupomInfo.valor), subtotal);
        } else if (cupomInfo.tipo === "frete_gratis") {
          deliveryFeeTotal = 0;
        }
        // Se quiser implementar "marmita_gratis", pode adicionar lógica aqui
      }
      const total = subtotal - descontoCupom + deliveryFeeTotal;
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
          subtotal: subtotal,
          descontoCupom: descontoCupom,
          deliveryFee: deliveryFeeTotal,
          total: total,
          status: 'pending',
          cupom: cupomInfo ? {
            codigo: cupomInfo.codigo,
            tipo: cupomInfo.tipo,
            valor: cupomInfo.valor || null
          } : null
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

  async function validarCupom() {
    setCupomErro(null);
    setCupomValidando(true);
    setCupomInfo(null);
    try {
      const res = await fetch(`/api/cupons?codigo=${encodeURIComponent(cupom.trim().toUpperCase())}`);
      if (!res.ok) throw new Error("Erro ao buscar cupom");
      const data = await res.json();
      if (!data || !Array.isArray(data) || data.length === 0) {
        setCupomErro("Cupom não encontrado ou inválido.");
        setCupomInfo(null);
      } else if (!data[0].ativo) {
        setCupomErro("Cupom inativo.");
        setCupomInfo(null);
      } else {
        setCupomInfo(data[0]);
        setCupomErro(null);
        toast({ title: "Cupom aplicado!", description: `Benefício: ${data[0].tipo === 'desconto' ? `R$ ${data[0].valor} de desconto` : data[0].tipo === 'frete_gratis' ? 'Frete grátis' : 'Brinde'}` });
      }
    } catch (e) {
      setCupomErro("Erro ao validar cupom.");
      setCupomInfo(null);
    }
    setCupomValidando(false);
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
  let descontoCupom = 0;
  let deliveryFeeTotal = deliveryMethod === "delivery" ? deliveryFee : 0;
  if (cupomInfo) {
    if (cupomInfo.tipo === "desconto" && cupomInfo.valor) {
      descontoCupom = Math.min(Number(cupomInfo.valor), subtotal);
    } else if (cupomInfo.tipo === "frete_gratis") {
      deliveryFeeTotal = 0;
    }
    // Se quiser implementar "marmita_gratis", pode adicionar lógica aqui
  }
  const total = subtotal - descontoCupom + deliveryFeeTotal;

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
              {/* Campo de cupom */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Cupom de desconto</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Digite o código"
                    value={cupom}
                    onChange={e => setCupom(e.target.value.toUpperCase())}
                    className="rounded-none"
                    maxLength={20}
                    disabled={!!cupomInfo}
                  />
                  <Button type="button" onClick={validarCupom} disabled={cupomValidando || !cupom.trim() || !!cupomInfo}>
                    {cupomValidando ? "Validando..." : "Aplicar"}
                  </Button>
                  {cupomInfo && (
                    <Button type="button" variant="outline" onClick={() => { setCupom(""); setCupomInfo(null); setCupomErro(null); }}>Remover</Button>
                  )}
                </div>
                {cupomErro && <div className="text-red-600 text-xs mt-1">{cupomErro}</div>}
                {cupomInfo && <div className="text-green-700 text-xs mt-1">Cupom aplicado: <b>{cupomInfo.codigo}</b> ({cupomInfo.tipo === 'desconto' ? `R$ ${cupomInfo.valor} de desconto` : cupomInfo.tipo === 'frete_gratis' ? 'Frete grátis' : 'Brinde'})</div>}
              </div>
              {/* Fim campo de cupom */}
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
                {cupomInfo && cupomInfo.tipo === "desconto" && descontoCupom > 0 && (
                  <div className="flex justify-between text-green-700">
                    <p>Desconto ({cupomInfo.codigo})</p>
                    <p>-{formatCurrency(descontoCupom)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p>Taxa de entrega</p>
                  <p>{calculandoEntrega ? "Calculando..." : formatCurrency(deliveryFeeTotal)}</p>
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
                              className="grid grid-cols-1 gap-4"
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
                                        {deliveryMethod === "delivery" ? (calculandoEntrega ? "Calculando..." : formatCurrency(deliveryFeeTotal)) : "Grátis"}
                                      </Badge>
                                    </FormLabel>
                                    <p className="text-sm text-neutral-500">
                                      Receba seu pedido em casa em até 45 minutos
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
