"use client"

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

// Define validation schema
const checkoutSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  paymentMethod: z.enum(["pix", "credit", "cash"]),
  name: z.string().min(3, "Nome é obrigatório").optional(),
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
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)

  // Initialize form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: "delivery",
      paymentMethod: "pix",
      name: "",
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
      form.setValue("phone", user.phone || "")
    }
  }, [isAuthenticated, user, mounted, form])

  // Handle form submission
  async function onSubmit(values: CheckoutFormValues) {
    setIsSubmitting(true)
    setIsProcessingOrder(true)
    console.log("Iniciando submissão do pedido...")

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

      console.log("Simulando chamada à API...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Limpando o carrinho...")
      clearCart()

      console.log("Aguardando limpeza do carrinho...")
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("Redirecionando para página de confirmação...")
      router.push("/pedido-confirmado")

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Seu pedido foi recebido e está sendo processado.",
      })
    } catch (error) {
      console.error("Erro ao processar pedido:", error)
      setIsProcessingOrder(false)
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
    <div className="container mx-auto px-4 py-24 max-w-6xl pt-28">
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
    </div>
  )
}

