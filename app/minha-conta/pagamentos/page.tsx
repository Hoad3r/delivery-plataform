"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CreditCard, Trash2, Pencil, Plus, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

// Define validation schema
const paymentMethodSchema = z.object({
  nickname: z.string().min(1, "Nome do cartão é obrigatório"),
  cardNumber: z
    .string()
    .min(16, "Número do cartão deve ter 16 dígitos")
    .max(16, "Número do cartão deve ter 16 dígitos"),
  cardholderName: z.string().min(1, "Nome no cartão é obrigatório"),
  expiryMonth: z.string().min(1, "Mês é obrigatório"),
  expiryYear: z.string().min(4, "Ano é obrigatório").max(4, "Ano deve ter 4 dígitos"),
  cvv: z.string().min(3, "CVV deve ter 3 ou 4 dígitos").max(4, "CVV deve ter 3 ou 4 dígitos"),
  isDefault: z.boolean().optional(),
})

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>

type PaymentMethod = PaymentMethodFormValues & {
  id: string
  type: "credit" | "debit"
  last4: string
}

export default function PaymentMethodsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)
  const [cardType, setCardType] = useState<"credit" | "debit">("credit")

  // Initialize form
  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      nickname: "",
      cardNumber: "",
      cardholderName: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      isDefault: false,
    },
  })

  // Load payment methods
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, load from localStorage
    const savedPaymentMethods = localStorage.getItem("userPaymentMethods")
    if (savedPaymentMethods) {
      try {
        setPaymentMethods(JSON.parse(savedPaymentMethods))
      } catch (error) {
        console.error("Failed to parse payment methods from localStorage:", error)
      }
    }
  }, [])

  // Save payment methods to localStorage when they change
  useEffect(() => {
    if (paymentMethods.length > 0) {
      localStorage.setItem("userPaymentMethods", JSON.stringify(paymentMethods))
    }
  }, [paymentMethods])

  // Reset form when editing payment changes
  useEffect(() => {
    if (editingPayment) {
      setCardType(editingPayment.type)
      form.reset({
        nickname: editingPayment.nickname,
        cardNumber: editingPayment.cardNumber,
        cardholderName: editingPayment.cardholderName,
        expiryMonth: editingPayment.expiryMonth,
        expiryYear: editingPayment.expiryYear,
        cvv: editingPayment.cvv,
        isDefault: editingPayment.isDefault || false,
      })
    } else {
      setCardType("credit")
      form.reset({
        nickname: "",
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        isDefault: paymentMethods.length === 0, // Make default if it's the first payment method
      })
    }
  }, [editingPayment, form, paymentMethods.length])

  // Handle form submission
  async function onSubmit(values: PaymentMethodFormValues) {
    setIsLoading(true)

    try {
      const last4 = values.cardNumber.slice(-4)

      if (editingPayment) {
        // Update existing payment method
        const updatedPaymentMethods = paymentMethods.map((payment) =>
          payment.id === editingPayment.id
            ? { ...values, id: payment.id, type: cardType, last4 }
            : values.isDefault
              ? { ...payment, isDefault: false }
              : payment,
        )
        setPaymentMethods(updatedPaymentMethods)

        toast({
          title: "Método de pagamento atualizado",
          description: `O cartão "${values.nickname}" foi atualizado com sucesso.`,
        })
      } else {
        // Add new payment method
        const newPaymentMethod: PaymentMethod = {
          ...values,
          id: `payment_${Date.now()}`,
          type: cardType,
          last4,
        }

        if (values.isDefault) {
          // If the new payment method is default, remove default from other payment methods
          const updatedPaymentMethods = paymentMethods.map((payment) => ({
            ...payment,
            isDefault: false,
          }))
          setPaymentMethods([...updatedPaymentMethods, newPaymentMethod])
        } else {
          setPaymentMethods([...paymentMethods, newPaymentMethod])
        }

        toast({
          title: "Método de pagamento adicionado",
          description: `O cartão "${values.nickname}" foi adicionado com sucesso.`,
        })
      }

      // Close dialog and reset form
      setDialogOpen(false)
      setEditingPayment(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o método de pagamento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle payment method deletion
  function handleDeletePayment(id: string) {
    const updatedPaymentMethods = paymentMethods.filter((payment) => payment.id !== id)
    setPaymentMethods(updatedPaymentMethods)

    toast({
      title: "Método de pagamento removido",
      description: "Seu método de pagamento foi removido com sucesso.",
    })

    setDeleteDialogOpen(false)
    setPaymentToDelete(null)
  }

  // Set payment method as default
  function setAsDefault(id: string) {
    const updatedPaymentMethods = paymentMethods.map((payment) => ({
      ...payment,
      isDefault: payment.id === id,
    }))
    setPaymentMethods(updatedPaymentMethods)

    toast({
      title: "Método de pagamento padrão atualizado",
      description: "Seu método de pagamento padrão foi atualizado com sucesso.",
    })
  }

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return {
      value: month.toString().padStart(2, "0"),
      label: month.toString().padStart(2, "0"),
    }
  })

  // Generate year options (current year + 10 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear + i
    return {
      value: year.toString(),
      label: year.toString(),
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light">Métodos de Pagamento</h2>
        <Button
          variant="outline"
          className="rounded-none border-black text-black opacity-50 cursor-not-allowed"
          disabled
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Cartão (desativado)
        </Button>
      </div>
      <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
        <strong>Atenção:</strong> No momento, só aceitamos pagamentos via <b>PIX</b>. O cadastro de cartões está temporariamente desativado.
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-300">
          <CreditCard className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-neutral-500 mb-6">
            O cadastro de cartões está temporariamente desativado. Aceitamos apenas pagamentos via PIX.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((payment) => (
            <div key={payment.id} className="border border-neutral-200 p-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="font-medium">{payment.nickname}</h3>
                    {payment.isDefault && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2 items-center">
                    <div className="bg-neutral-100 px-2 py-1 text-xs uppercase font-medium rounded">{payment.type}</div>
                    <p className="text-sm text-neutral-600">•••• •••• •••• {payment.last4}</p>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    Expira em {payment.expiryMonth}/{payment.expiryYear}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingPayment(payment)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog
                    open={deleteDialogOpen && paymentToDelete === payment.id}
                    onOpenChange={(open) => {
                      setDeleteDialogOpen(open)
                      if (!open) setPaymentToDelete(null)
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => setPaymentToDelete(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Cartão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover este cartão? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-none bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {!payment.isDefault && (
                <>
                  <Separator className="my-3" />
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={() => setAsDefault(payment.id)}>
                    <Check className="h-4 w-4 mr-1" /> Definir como padrão
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

