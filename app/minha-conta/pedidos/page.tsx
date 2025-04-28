"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSearchParams } from "next/navigation"
import { Download, Clock, Check, FileText, Calendar, Repeat, EyeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"

// Mock order data
const mockOrders = [
  {
    id: "ORD-001",
    date: new Date(2023, 8, 25, 18, 30),
    status: "delivered",
    items: [
      { id: "1", name: "Marmita Tradicional P", quantity: 2, price: 16.9 },
      { id: "3", name: "Marmita Fitness", quantity: 1, price: 20.9 },
    ],
    total: 54.7,
    delivery: {
      address: "Rua das Oliveiras, 123, Jardim Primavera, São Paulo, SP",
      time: "19:15",
    },
    payment: {
      method: "credit",
      card: "•••• 1234",
    },
  },
  {
    id: "ORD-002",
    date: new Date(2023, 8, 20, 12, 15),
    status: "delivered",
    items: [
      { id: "2", name: "Marmita Tradicional M", quantity: 1, price: 18.9 },
      { id: "5", name: "Marmita Vegetariana", quantity: 1, price: 20.9 },
    ],
    total: 39.8,
    delivery: {
      address: "Rua das Oliveiras, 123, Jardim Primavera, São Paulo, SP",
      time: "13:00",
    },
    payment: {
      method: "pix",
    },
  },
  {
    id: "ORD-003",
    date: new Date(2023, 8, 18, 19, 45),
    status: "canceled",
    items: [{ id: "4", name: "Marmita Low Carb", quantity: 1, price: 22.9 }],
    total: 22.9,
    delivery: {
      address: "Rua das Oliveiras, 123, Jardim Primavera, São Paulo, SP",
      time: "20:30",
    },
    payment: {
      method: "credit",
      card: "•••• 5678",
    },
  },
  {
    id: "ORD-004",
    date: new Date(),
    status: "processing",
    items: [
      { id: "1", name: "Marmita Tradicional P", quantity: 1, price: 16.9 },
      { id: "6", name: "Marmita Executiva", quantity: 1, price: 24.9 },
    ],
    total: 41.8,
    delivery: {
      address: "Rua das Oliveiras, 123, Jardim Primavera, São Paulo, SP",
      time: "20:00",
    },
    payment: {
      method: "debit",
      card: "•••• 9012",
    },
  },
]

// Status translations
const statusTranslations = {
  processing: { label: "Em Preparo", color: "bg-blue-100 text-blue-800" },
  delivering: { label: "Em Entrega", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  canceled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
}

// Payment method translations
const paymentMethodTranslations = {
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "PIX",
  cash: "Dinheiro",
}

export default function OrdersPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(orders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [userOrders, setUserOrders] = useState<any[]>([])

  // Load user orders from localStorage
  useEffect(() => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use localStorage and mock data
      const savedOrders = localStorage.getItem("userOrders")
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders)
        if (Array.isArray(parsedOrders)) {
          setUserOrders(parsedOrders)
        }
      }

      // If no saved orders, use mock data
      if (!savedOrders || JSON.parse(savedOrders).length === 0) {
        // Save mock orders to localStorage for this user
        if (isAuthenticated && user) {
          const ordersWithUserId = mockOrders.map((order) => ({
            ...order,
            userId: user.id,
          }))
          localStorage.setItem("userOrders", JSON.stringify(ordersWithUserId))
          setUserOrders(ordersWithUserId)
        }
      }
    } catch (error) {
      console.error("Failed to load orders:", error)
    }
  }, [isAuthenticated, user])

  // Filter orders by user
  useEffect(() => {
    if (isAuthenticated && user && userOrders.length > 0) {
      const filteredByUser = userOrders.filter((order) => order.userId === user.id)
      setOrders(filteredByUser)
      setFilteredOrders(filteredByUser)
    } else {
      setOrders(mockOrders)
      setFilteredOrders(mockOrders)
    }
  }, [isAuthenticated, user, userOrders])

  // Apply filters when they change
  useEffect(() => {
    let result = orders

    // Apply search term filter
    if (searchTerm) {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter)
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate)
      result = result.filter((order) => order.date >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of the day
      result = result.filter((order) => order.date <= end)
    }

    setFilteredOrders(result)
  }, [orders, searchTerm, statusFilter, startDate, endDate])

  // Handle repeating an order
  const handleRepeatOrder = (order) => {
    // Add all items from the order to the cart
    order.items.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })
    })

    toast({
      title: "Itens adicionados ao carrinho",
      description: "Os itens do pedido foram adicionados ao seu carrinho.",
    })
  }

  // Download order receipt (would be a PDF in a real app)
  const handleDownloadReceipt = (orderId) => {
    toast({
      title: "Comprovante baixado",
      description: "O comprovante do pedido foi baixado com sucesso.",
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-light mb-6">Meus Pedidos</h2>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por número do pedido ou itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-none w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-none w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="processing">Em Preparo</SelectItem>
                <SelectItem value="delivering">Em Entrega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-48">
            <label className="block text-sm text-neutral-500 mb-1">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-none w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm text-neutral-500 mb-1">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-none w-full"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-none border-black text-black hover:bg-black hover:text-white h-10"
            onClick={() => {
              setStartDate("")
              setEndDate("")
              setSearchTerm("")
              setStatusFilter("all")
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-300">
          <FileText className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
          <p className="text-neutral-500 mb-6">
            {orders.length === 0
              ? "Você ainda não fez nenhum pedido. Explore nosso cardápio e faça seu primeiro pedido."
              : "Nenhum pedido corresponde aos filtros selecionados. Tente outros filtros."}
          </p>
          {orders.length === 0 && (
            <Link href="/cardapio">
              <Button
                variant="outline"
                className="rounded-none border-black text-black hover:bg-black hover:text-white"
              >
                Explorar Cardápio
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border border-neutral-200 p-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Pedido {order.id}</h3>
                    <Badge className={`${statusTranslations[order.status].color} font-normal`}>
                      {statusTranslations[order.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span>{format(order.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setSelectedOrder(order)
                      setOrderDetailsOpen(true)
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownloadReceipt(order.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {order.status === "delivered" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 rounded-none"
                      onClick={() => handleRepeatOrder(order)}
                    >
                      <Repeat className="h-4 w-4 mr-1" /> Repetir
                    </Button>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex flex-col md:flex-row justify-between">
                <div className="text-sm">
                  <div className="font-medium mb-1">Itens do Pedido</div>
                  <ul className="text-neutral-600 space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:text-right mt-4 md:mt-0">
                  <div className="font-medium">Total: R$ {order.total.toFixed(2)}</div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {paymentMethodTranslations[order.payment.method]} {order.payment.card && `(${order.payment.card})`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                {format(selectedOrder.date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Status do Pedido</h4>
                <Badge className={`${statusTranslations[selectedOrder.status].color} font-normal`}>
                  {statusTranslations[selectedOrder.status].label}
                </Badge>

                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "processing" || selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
                  >
                    <Check className="h-5 w-5 mb-1" />
                    <span className="text-xs">Confirmado</span>
                  </div>
                  <div
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "processing" || selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
                  >
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="text-xs">Em Preparo</span>
                  </div>
                  <div
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
                  >
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="text-xs">Saiu para Entrega</span>
                  </div>
                  <div
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
                  >
                    <Check className="h-5 w-5 mb-1" />
                    <span className="text-xs">Entregue</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </div>
                      <div>R$ {(item.price * item.quantity).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>

                <Separator className="my-3" />

                <div className="flex justify-between font-medium">
                  <div>Total</div>
                  <div>R$ {selectedOrder.total.toFixed(2)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Endereço de Entrega</h4>
                  <p className="text-sm text-neutral-600">{selectedOrder.delivery.address}</p>
                  <p className="text-sm text-neutral-600 mt-1">Horário previsto: {selectedOrder.delivery.time}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Forma de Pagamento</h4>
                  <p className="text-sm text-neutral-600">
                    {paymentMethodTranslations[selectedOrder.payment.method]}{" "}
                    {selectedOrder.payment.card && `(${selectedOrder.payment.card})`}
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={() => handleDownloadReceipt(selectedOrder.id)}
                >
                  <Download className="h-4 w-4 mr-1" /> Baixar Comprovante
                </Button>

                {selectedOrder.status === "delivered" && (
                  <Button
                    variant="outline"
                    className="rounded-none"
                    onClick={() => {
                      handleRepeatOrder(selectedOrder)
                      setOrderDetailsOpen(false)
                    }}
                  >
                    <Repeat className="h-4 w-4 mr-1" /> Repetir Pedido
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

