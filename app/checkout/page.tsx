"use client"
// deploy
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { formatCurrency } from "@/lib/utils"
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
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const { user, isAuthenticated, addresses, addAddress } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [isPixPaid, setIsPixPaid] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

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
    },
  })

  // Watch delivery method to conditionally show address field
  const deliveryMethod = form.watch("deliveryMethod")
  const paymentMethod = form.watch("paymentMethod")

  // Redirect if cart is empty
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && cart.length === 0) {
      router.push("/cardapio")
    }
  }, [cart, router, mounted])

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
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/mercadopago/status?id=${paymentId}`);
          const data = await response.json();

          if (response.ok) {
            console.log('Payment status check:', data.status);
            if (data.status === 'approved') {
              // Payment confirmed
              clearInterval(intervalId!); // Stop polling
              setPixQrCode(null); // Close modal
              setPixCode(null);
              setPaymentId(null); // Clear payment ID
              setIsPixPaid(true); // Indicate payment is paid (optional, depends on usage)

              // Proceed to save order and redirect
              // You might want to move the order saving logic here or trigger it
              // after payment is approved. For now, let's just redirect.
              clearCart();
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pedido foi recebido e está sendo preparado.",
                variant: "success"
              });
              router.push("/pedido-confirmado");
            } else if (data.status === 'rejected' || data.status === 'cancelled') {
              // Payment failed or cancelled
              clearInterval(intervalId!); // Stop polling
              setPixQrCode(null); // Close modal
              setPixCode(null);
              setPaymentId(null); // Clear payment ID
              toast({
                title: "Pagamento não aprovado",
                description: "O pagamento foi rejeitado ou cancelado. Tente novamente.",
                variant: "destructive"
              });
            }
            // Keep polling for other statuses (pending, in_process, etc.)
          } else {
            console.error('Error fetching payment status:', data);
            // Optionally stop polling after a few errors or show a message
          }
        } catch (error) {
          console.error('Error during payment status polling:', error);
          // Optionally stop polling after a few errors
        }
      }, 5000); // Poll every 5 seconds
    }

    // Cleanup interval on component unmount or when paymentId changes to null
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [paymentId, router, clearCart, toast]);

  // Handle form submission
  async function onSubmit(values: CheckoutFormValues) {
    setIsSubmitting(true)
    setIsProcessingOrder(true)
    console.log("Iniciando submissão do pedido...")
    console.log("Valor total:", total)

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
            
            // Add new address
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

            // Update user document with new address
            await updateDoc(userRef, {
              addresses: addresses
            });
          }
        } catch (error) {
          console.error("Error saving address:", error);
          toast({
            title: "Erro ao salvar endereço",
            description: "Não foi possível salvar o endereço para uso futuro.",
            variant: "destructive",
          });
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
            `${values.streetName}, ${values.number}${values.complement ? ` - ${values.complement}` : ''}${values.referencePoint ? ` (${values.referencePoint})` : ''}` : 
            null,
          time: values.deliveryMethod === 'delivery' ? '45 minutos' : '30 minutos'
        },
        payment: {
          method: values.paymentMethod,
          total: total,
          status: 'pending'
        },
        notes: values.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        statusHistory: {
          payment_pending: {
            timestamp: serverTimestamp(),
            note: 'Pedido criado, aguardando pagamento'
          }
        }
      };

      // Salvar o pedido no Firestore
      const newOrderRef = await addDoc(orderRef, orderData);
      console.log("Pedido criado com sucesso:", newOrderRef.id);

      // 2. Depois gerar o pagamento PIX
      const pixPayload = {
        amount: Number(total.toFixed(2)),
        description: `Pedido Nossa Cozinha - ${new Date().toLocaleDateString()}`,
        orderId: orderId
      }
      
      console.log("Gerando pagamento PIX para o pedido:", orderId);

      const pixResponse = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pixPayload),
      })

      const paymentData = await pixResponse.json()
      console.log("Resposta PIX:", paymentData)

      if (!pixResponse.ok) {
        console.error('Erro PIX:', {
          status: pixResponse.status,
          data: paymentData
        })
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
        console.error('QR Code não encontrado na resposta:', paymentData)
        toast({
          title: "Erro ao gerar QR Code",
          description: "Não foi possível gerar o QR Code PIX. Tente novamente.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        setIsProcessingOrder(false)
        return
      }

      // 3. Exibir o QR Code para o cliente
      setPixQrCode(paymentData.qr_code_base64)
      setPixCode(paymentData.qr_code)
      setPaymentId(paymentData.id)
      setIsProcessingOrder(false)
      setIsSubmitting(false)

      toast({
        title: "QR Code PIX gerado",
        description: "Escaneie o QR Code ou copie o código para pagar.",
        variant: "success"
      })
    } catch (error) {
      console.error("Erro ao processar pedido:", error)
      setIsProcessingOrder(false)
      setIsSubmitting(false)
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (isProcessingOrder) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-3xl pt-28">
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <h2 className="text-2xl font-light">Processando seu pedido...</h2>
            <p className="text-neutral-500">Por favor, aguarde enquanto finalizamos seu pedido.</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything until component is mounted or cart is empty
  if (!mounted || cart.length === 0) {
    return null
  }

  const subtotal = cart.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0)
  const deliveryFee = deliveryMethod === "delivery" ? 5.0 : 0
  const total = subtotal + deliveryFee

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
                  <p>{formatCurrency(deliveryFee)}</p>
                </div>
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
                                        +R$ 5,00
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
                              form.setValue("referencePoint", selectedAddress.neighborhood || ""); // Assuming neighborhood can be used as reference or add a new field in type
                              // Note: The Address type in auth-context does not have referencePoint. You might need to update it.
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full rounded-none bg-primary text-white hover:bg-primary/90"
                    disabled={isSubmitting}
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

