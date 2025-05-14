"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSearchParams } from "next/navigation"
import { Download, Clock, Check, FileText, Calendar, Repeat, EyeIcon } from "lucide-react"
import { collection, addDoc, Timestamp, getDocs, query, where, orderBy } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { db } from "@/lib/firebase"

// Status translations
const statusTranslations: Record<string, { label: string; color: string }> = {
  preparing: { label: "Em preparo", color: "bg-yellow-100 text-yellow-800" },
  delivering: { label: "Em entrega", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  pending: { label: "Pendente", color: "bg-gray-100 text-gray-800" },
  payment_pending: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-800" }
}

// Payment method translations
const paymentMethodTranslations: Record<OrderPayment['method'], string> = {
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "PIX",
  cash: "Dinheiro",
}

// Tipos para os pedidos
interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface OrderPayment {
  method: 'credit' | 'debit' | 'pix' | 'cash'
  card?: string
  total: number
}

interface OrderDelivery {
  address: string
  time: string
}

interface Order {
  id: string
  date: Date
  status: 'preparing' | 'delivering' | 'delivered' | 'cancelled' | 'pending' | 'payment_pending'
  items: OrderItem[]
  total: number
  delivery: OrderDelivery
  payment: OrderPayment
  userId?: string
}

export default function OrdersPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { addItem, cart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar pedidos do Firestore
  useEffect(() => {
    let isMounted = true
    let isFirstLoad = true

    const carregarPedidos = async () => {
      // Se não estiver autenticado ou não tiver usuário, limpa os pedidos
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          setOrders([])
          setFilteredOrders([])
          setIsLoading(false)
        }
        return
      }

      // Evita recarregar se já tiver pedidos e não for a primeira carga
      if (orders.length > 0 && !isFirstLoad) {
        return
      }

      try {
        if (isMounted) {
          setIsLoading(true)
        }
        
        const ordersRef = collection(db, 'orders')
        const q = query(
          ordersRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        
        if (isMounted) {
          const pedidosCarregados = querySnapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              date: new Date(data.createdAt),
            }
          }) as Order[]

          setOrders(pedidosCarregados)
          setFilteredOrders(pedidosCarregados)
          setIsLoading(false)
          isFirstLoad = false
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error)
        if (isMounted) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus pedidos.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    }

    carregarPedidos()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user?.id]) // Usamos apenas o ID do usuário como dependência

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
  const handleRepeatOrder = (order: Order) => {
    let algumJaNoCarrinho = false;
    order.items.forEach((item: OrderItem) => {
      const existeNoCarrinho = cart.some(
        (cartItem) => cartItem.id === item.id
      )
      if (existeNoCarrinho) {
        algumJaNoCarrinho = true;
      } else {
        addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })
      }
    })

    if (algumJaNoCarrinho) {
      toast({
        title: "Itens já estão no carrinho",
        description: "Alguns itens do pedido já estavam no seu carrinho e não foram adicionados novamente.",
        variant: "default"
      })
    } else {
      toast({
        title: "Itens adicionados ao carrinho",
        description: "Os itens do pedido foram adicionados ao seu carrinho.",
        variant: "success"
      })
    }
  }

  // Download order receipt (would be a PDF in a real app)
  const handleDownloadReceipt = (orderId: string) => {
    toast({
      title: "Comprovante baixado",
      description: "O comprovante do pedido foi baixado com sucesso.",
      variant: "success"
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light">Meus Pedidos</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seus pedidos...</p>
        </div>
      ) : (
        <>
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
                    <SelectItem value="preparing">Em Preparo</SelectItem>
                    <SelectItem value="delivering">Em Entrega</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="payment_pending">Aguardando Pagamento</SelectItem>
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
                      <div className="font-medium">Total: R$ {order.payment.total.toFixed(2)}</div>
                      <div className="text-sm text-neutral-500 mt-1">
                        {paymentMethodTranslations[order.payment.method]} {order.payment.card && `(${order.payment.card})`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "preparing" || selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
                  >
                    <Check className="h-5 w-5 mb-1" />
                    <span className="text-xs">Confirmado</span>
                  </div>
                  <div
                    className={`p-3 flex flex-col items-center text-center ${selectedOrder.status === "preparing" || selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? "text-black" : "text-neutral-400"}`}
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
                  {selectedOrder.items.map((item: OrderItem, index: number) => (
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
                  <div>R$ {selectedOrder.payment.total.toFixed(2)}</div>
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

