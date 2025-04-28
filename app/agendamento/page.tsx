"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format, addDays, isAfter, isBefore, isToday } from "date-fns"
import { z } from "zod"
import { Calendar, Clock, CalendarCheck, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/cart-context"

// Define validation schema
const scheduleSchema = z.object({
  date: z.date({
    required_error: "Selecione uma data para o pedido",
  }),
  time: z.string({
    required_error: "Selecione um horário para o pedido",
  }),
  instructions: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

// Time slots
const timeSlots = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
]

// Mock data for capacity
const dailyCapacity = 20 // Maximum capacity per day
const capacityThreshold = 0.85 // 85% threshold

// Mock function to get capacity for a date
const getCapacityForDate = (date: Date): number => {
  // In a real app, this would fetch from an API
  // For now, just generate a random number between 10 and 20
  const dateString = format(date, "yyyy-MM-dd")

  // Use the sum of the character codes as a seed for pseudo-random number
  const seed = dateString.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)

  // Generate a "random" number based on the date
  return (seed % 11) + 10 // Between 10 and 20
}

// Mock function to get unavailable time slots for a date
const getUnavailableTimesForDate = (date: Date): string[] => {
  // In a real app, this would fetch from an API
  // For now, generate some random unavailable slots
  const dateString = format(date, "yyyy-MM-dd")
  const seed = dateString.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)

  // Use the date's seed to determine unavailable slots
  const unavailableTimes: string[] = []
  timeSlots.forEach((slot, index) => {
    if ((seed + index) % 3 === 0) {
      unavailableTimes.push(slot)
    }
  })

  return unavailableTimes
}

export default function SchedulePage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { cart, clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [dateCapacity, setDateCapacity] = useState<number>(0)
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([])
  const [dateAtCapacity, setDateAtCapacity] = useState(false)

  // Check if cart is empty and redirect if necessary
  useEffect(() => {
    if (cart.length === 0) {
      router.push("/cardapio")
    }
  }, [cart, router])

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para agendar um pedido.",
        variant: "destructive",
      })
      router.push("/login?redirect=/agendamento")
    }
  }, [isAuthenticated, toast, router])

  // Initialize form
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: undefined,
      time: "",
      instructions: "",
    },
  })

  // Function to check if date is disabled
  const isDateDisabled = (date: Date) => {
    // Disable dates in the past
    if (isBefore(date, new Date()) && !isToday(date)) {
      return true
    }

    // Disable dates more than 14 days in the future
    if (isAfter(date, addDays(new Date(), 14))) {
      return true
    }

    // Check capacity for this date
    const capacity = getCapacityForDate(date)
    const percentFilled = capacity / dailyCapacity

    // Disable if over threshold
    return percentFilled >= 1
  }

  // Update capacity and unavailable times when date changes
  const onDateChange = (date: Date | undefined) => {
    if (date) {
      const capacity = getCapacityForDate(date)
      setDateCapacity(capacity)

      const percentFilled = capacity / dailyCapacity
      setDateAtCapacity(percentFilled >= capacityThreshold)

      const unavailable = getUnavailableTimesForDate(date)
      setUnavailableTimes(unavailable)

      // If current selected time is now unavailable, reset it
      const currentTime = form.getValues("time")
      if (currentTime && unavailable.includes(currentTime)) {
        form.setValue("time", "")
      }
    }
  }

  // Handle form submission
  async function onSubmit(values: ScheduleFormValues) {
    setIsLoading(true)

    try {
      // Simulate API call to schedule order
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Format datetime for display
      const formattedDate = format(values.date, "dd/MM/yyyy")

      toast({
        title: "Pedido agendado com sucesso!",
        description: `Seu pedido foi agendado para ${formattedDate} às ${values.time}.`,
      })

      // Clear cart and redirect to confirmation page
      clearCart()

      // In a real app, this would create an order in the database
      // and then redirect to a confirmation page with the order ID
      router.push("/pedido-confirmado")
    } catch (error) {
      toast({
        title: "Erro ao agendar pedido",
        description: "Ocorreu um erro ao tentar agendar seu pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate subtotal
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = 5.0
  const total = subtotal + deliveryFee

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl pt-28">
      <h1 className="text-3xl font-light mb-2 text-center">Agendar Entrega</h1>
      <p className="text-neutral-500 mb-8 text-center">Escolha a data e horário para receber seu pedido</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="border border-neutral-200 p-6">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Data de Entrega
                </h2>

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Selecione a data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-none",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date)
                              onDateChange(date)
                            }}
                            disabled={isDateDisabled}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.getValues("date") && dateAtCapacity && (
                  <Alert className="mt-4 border-yellow-200 bg-yellow-50 text-yellow-800">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Capacidade limitada</AlertTitle>
                    <AlertDescription>
                      Esta data está próxima da capacidade máxima. Alguns horários podem não estar disponíveis.
                    </AlertDescription>
                  </Alert>
                )}

                {form.getValues("date") && !dateAtCapacity && (
                  <div className="flex items-center gap-2 text-green-800 mt-4">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="text-sm">Data disponível com boa capacidade</span>
                  </div>
                )}
              </div>

              {form.getValues("date") && (
                <div className="border border-neutral-200 p-6">
                  <h2 className="text-xl font-light mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horário de Entrega
                  </h2>

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecione o horário</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-2"
                          >
                            {timeSlots.map((time) => {
                              const isUnavailable = unavailableTimes.includes(time)
                              return (
                                <div key={time}>
                                  <RadioGroupItem
                                    value={time}
                                    id={`time-${time}`}
                                    className="peer sr-only"
                                    disabled={isUnavailable}
                                  />
                                  <label
                                    htmlFor={`time-${time}`}
                                    className={cn(
                                      "flex items-center justify-center rounded-sm border border-neutral-200 p-2 text-sm font-medium",
                                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                                      "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:bg-neutral-100",
                                      "hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer",
                                      "peer-disabled:hover:bg-neutral-100 peer-disabled:hover:text-neutral-500",
                                    )}
                                  >
                                    {time}
                                  </label>
                                </div>
                              )
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.getValues("date") && form.getValues("time") && (
                <div className="border border-neutral-200 p-6">
                  <h2 className="text-xl font-light mb-6">Instruções Adicionais</h2>

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instruções para entrega (opcional)</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="flex min-h-[80px] w-full rounded-sm border border-neutral-200 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Ex: Interfone 123, apartamento no final do corredor, deixar com o porteiro, etc."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="rounded-none bg-black text-white hover:bg-neutral-800"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? "Processando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          <div className="border border-neutral-200 p-6 sticky top-24">
            <h2 className="text-xl font-light mb-6">Resumo do Pedido</h2>

            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-neutral-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Taxa de Entrega</span>
                <span>R$ {deliveryFee.toFixed(2)}</span>
              </div>
              <Separator className="my-4" />
              <div className="font-medium flex justify-between">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="schedule-info">
                <AccordionTrigger className="text-sm">Informações sobre Agendamento</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-neutral-500">
                    <p>• Os pedidos podem ser agendados com até 14 dias de antecedência.</p>
                    <p>• Os horários disponíveis dependem da capacidade e da rota de entrega.</p>
                    <p>• Pedidos agendados não podem ser cancelados com menos de 4 horas de antecedência.</p>
                    <p>• O pagamento é processado no momento da confirmação do agendamento.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  )
}

