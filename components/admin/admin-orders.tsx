"use client"

import { useState, useEffect } from "react"
import {
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Printer,
  MessageSquare,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

// Mock data for orders
const mockOrders: Order[] = [
  {
    "id": "ORD-001",
    "userId": "placeholder-user-id-1",
    "user": {
      "name": "João Silva",
      "phone": "(11) 99999-9999"
    },
    "createdAt": "2023-11-28T18:30:00",
    "type": "delivery",
    "status": "preparing",
    "delivery": {
      "address": "Rua das Flores, 123, Apto 45, Jardim Primavera, São Paulo, SP",
      "time": null
    },
    "items": [
      { "id": "1", "name": "Marmita Tradicional P", "price": 16.9, "quantity": 2 },
      { "id": "3", "name": "Marmita Fitness", "price": 20.9, "quantity": 1 }
    ],
    "payment": {
      "method": "pix",
      "total": 54.7,
      "status": "pending"
    },
    "notes": "Sem cebola na marmita fitness, por favor."
  },
  {
    "id": "ORD-002",
    "userId": "placeholder-user-id-2",
    "user": {
      "name": "Maria Santos",
      "phone": "(11) 98888-8888"
    },
    "createdAt": "2023-11-28T18:15:00",
    "type": "delivery",
    "status": "delivering",
    "delivery": {
      "address": "Av. Paulista, 1000, Bela Vista, São Paulo, SP",
      "time": null
    },
    "items": [
      { "id": "2", "name": "Marmita Tradicional M", "price": 18.9, "quantity": 1 },
      { "id": "5", "name": "Marmita Vegetariana", "price": 20.9, "quantity": 1 }
    ],
    "payment": {
      "method": "credit",
      "card": "•••• 1234",
      "total": 39.8,
      "status": "paid"
    },
    "notes": ""
  },
  {
    "id": "ORD-003",
    "userId": "placeholder-user-id-3",
    "user": {
      "name": "Pedro Oliveira",
      "phone": "(11) 97777-7777"
    },
    "createdAt": "2023-11-28T17:45:00",
    "type": "delivery",
    "status": "delivered",
    "delivery": {
      "address": "Rua Augusta, 500, Consolação, São Paulo, SP",
      "time": "2023-11-28T18:30:00"
    },
    "items": [
      { "id": "4", "name": "Marmita Low Carb", "price": 22.9, "quantity": 1 },
      { "id": "6", "name": "Marmita Executiva", "price": 24.9, "quantity": 1 }
    ],
    "payment": {
      "method": "pix",
      "total": 47.8,
      "status": "paid"
    },
    "notes": "Entregar na portaria."
  },
  {
    "id": "ORD-004",
    "userId": "placeholder-user-id-4",
    "user": {
      "name": "Ana Costa",
      "phone": "(11) 96666-6666"
    },
    "createdAt": "2023-11-28T17:30:00",
    "type": "pickup",
    "status": "delivered",
    "delivery": {
      "address": "",
      "time": null
    },
    "items": [
      { "id": "1", "name": "Marmita Tradicional P", "price": 16.9, "quantity": 1 }
    ],
    "payment": {
      "method": "cash",
      "total": 16.9,
      "status": "pending"
    },
    "notes": ""
  }
];

// Status translations and colors
const statusInfo = {
  preparing: { label: "Em Preparo", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  delivering: { label: "Em Entrega", color: "bg-blue-100 text-blue-800", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> },
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-800", icon: <AlertCircle className="h-4 w-4" /> },
  payment_pending: { label: "Pagamento Pendente", color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="h-4 w-4" /> },
}

// Payment status translations and colors
const paymentStatusInfo = {
  paid: { label: "Pago", color: "bg-green-100 text-green-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  refunded: { label: "Reembolsado", color: "bg-red-100 text-red-800" },
}

// Payment method translations
const paymentMethodInfo = {
  credit: { label: "Cartão de Crédito", icon: "💳" },
  debit: { label: "Cartão de Débito", icon: "💳" },
  pix: { label: "PIX", icon: "📱" },
  cash: { label: "Dinheiro", icon: "💵" },
}

// Format date
const formatDate = (dateString: string | number | Date) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Interfaces para tipagem
interface User {
  name: string;
  phone: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

type PaymentStatus = "paid" | "pending" | "refunded";

interface OrderPayment {
  method: "pix" | "credit" | "debit" | "cash";
  total: number;
  card?: string;
  status: PaymentStatus;
}

interface OrderDelivery {
  address: string | null;
  time: string | null;
}

type OrderStatus = "preparing" | "delivering" | "delivered" | "cancelled" | "pending" | "payment_pending";
type OrderType = "delivery" | "pickup";

interface Order {
  id: string;
  userId: string;
  user: User;
  createdAt: string;
  type: OrderType;
  status: OrderStatus;
  delivery: OrderDelivery;
  items: OrderItem[];
  payment: OrderPayment;
  notes: string;
}

type SortableKey = "createdAt" | "status" | "total";

export default function AdminOrders() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: "asc" | "desc" }>({ key: "createdAt", direction: "desc" })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)

  // Atualiza os pedidos com o ID do usuário logado
  useEffect(() => {
    if (user) {
      const updatedOrders = mockOrders.map(order => ({
        ...order,
        userId: user.uid,
        user: {
          ...order.user,
          uid: user.uid
        }
      }))
      setOrders(updatedOrders)
      setFilteredOrders(updatedOrders)
    }
  }, [user])

  // Handle search and filtering
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    applyFilters(term, statusFilter, dateFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    applyFilters(searchTerm, value, dateFilter)
  }

  const handleDateFilter = (value: string) => {
    setDateFilter(value)
    applyFilters(searchTerm, statusFilter, value)
  }

  const applyFilters = (term: string, status: string, date: string) => {
    let result = [...orders]

    // Apply search term
    if (term) {
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(term) ||
          order.user.name.toLowerCase().includes(term) ||
          order.user.phone.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (status !== "all") {
      result = result.filter((order) => order.status === status)
    }

    // Apply date filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    if (date === "today") {
      result = result.filter((order) => new Date(order.createdAt) >= today)
    } else if (date === "yesterday") {
      result = result.filter((order) => new Date(order.createdAt) >= yesterday && new Date(order.createdAt) < today)
    } else if (date === "week") {
      result = result.filter((order) => new Date(order.createdAt) >= lastWeek)
    } else if (date === "month") {
      result = result.filter((order) => new Date(order.createdAt) >= lastMonth)
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Order]
      const bValue = b[sortConfig.key as keyof Order]
      
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredOrders(result)
  }

  // Handle sorting
  const requestSort = (key: SortableKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (key === "status") {
        // Ordem específica para status
        const statusOrder = {
          "preparing": 1,
          "delivering": 2,
          "delivered": 3,
          "cancelled": 4,
          "pending": 5,
          "payment_pending": 6
        }
        aValue = statusOrder[a.status]
        bValue = statusOrder[b.status]
      } else if (key === "total") {
        aValue = a.payment.total
        bValue = b.payment.total
      } else {
        aValue = a[key]
        bValue = b[key]
      }
      
      if (aValue < bValue) {
        return direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredOrders(sortedOrders)
  }

  // Função para salvar uma nova ordem
  const saveOrder = async (order: Order) => {
    try {
      const ordersRef = collection(db, "orders")
      await addDoc(ordersRef, order)
      
      toast({
        title: "Pedido salvo",
        description: `Pedido ${order.id} foi salvo com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao salvar pedido:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o pedido. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Atualiza o status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      })

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      })
    }
  }

  // Substitui a função handleStatusChange existente
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus)
  }

  // View order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setOrderDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar por ID, cliente ou telefone..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 rounded-none"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="preparing">Em Preparo</SelectItem>
                <SelectItem value="delivering">Em Entrega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={dateFilter} onValueChange={handleDateFilter}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Gerenciamento de Pedidos</CardTitle>
          <CardDescription>{filteredOrders.length} pedidos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("createdAt")}>
                      Data
                      {sortConfig.key === "createdAt" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("total")}>
                      Valor
                      {sortConfig.key === "total" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">
                    <div className="flex items-center cursor-pointer" onClick={() => requestSort("status")}>
                      Status
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Pagamento</th>
                  <th className="text-left py-3 px-4 font-medium">Entrega</th>
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-neutral-500">
                      Nenhum pedido encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4 font-medium">{order.id}</td>
                      <td className="py-3 px-4">
                        <div>{order.user.name}</div>
                        <div className="text-xs text-neutral-500">{order.user.phone}</div>
                      </td>
                      <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">R$ {order.payment.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`${statusInfo[order.status].color} font-normal flex items-center gap-1 w-fit`}
                        >
                          {statusInfo[order.status].icon}
                          {statusInfo[order.status].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span>{paymentMethodInfo[order.payment.method].icon}</span>
                          <span className="text-xs">{paymentMethodInfo[order.payment.method].label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs">{order.type === "delivery" ? "Entrega" : "Retirada"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                              </DropdownMenuItem>

                              {order.status === "preparing" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivering")}>
                                  <Truck className="h-4 w-4 mr-2" /> Marcar como Em Entrega
                                </DropdownMenuItem>
                              )}

                              {(order.status === "preparing" || order.status === "delivering") && (
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivered")}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Entregue
                                </DropdownMenuItem>
                              )}

                              {(order.status === "preparing" || order.status === "delivering") && (
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}>
                                  <XCircle className="h-4 w-4 mr-2" /> Cancelar Pedido
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" /> Imprimir
                              </DropdownMenuItem>

                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" /> Contatar Cliente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre este pedido - {formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="customer">Cliente</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div>
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </div>
                        <div>R$ {(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between font-medium">
                    <div>Total</div>
                    <div>R$ {selectedOrder.payment.total.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Método de Pagamento</h4>
                  <div className="flex items-center gap-2">
                    <span>{paymentMethodInfo[selectedOrder.payment.method].icon}</span>
                    <span>{paymentMethodInfo[selectedOrder.payment.method].label}</span>
                    <Badge className={paymentStatusInfo[selectedOrder.payment.status].color}>
                      {paymentStatusInfo[selectedOrder.payment.status].label}
                    </Badge>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Observações</h4>
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm text-sm">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Informações do Cliente</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-neutral-500 text-sm">Nome:</span>
                      <div>{selectedOrder.user.name}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-sm">Telefone:</span>
                      <div>{selectedOrder.user.phone}</div>
                    </div>
                    {selectedOrder.type === "delivery" && selectedOrder.delivery.address && (
                      <div>
                        <span className="text-neutral-500 text-sm">Endereço:</span>
                        <div>{selectedOrder.delivery.address}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Método de Entrega</h4>
                  <Badge className="bg-neutral-100 text-neutral-800">
                    {selectedOrder.type === "delivery" ? "Entrega" : "Retirada"}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Histórico de Pedidos</h4>
                  <div className="text-sm text-neutral-500">Este cliente fez 5 pedidos nos últimos 3 meses.</div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Status Atual</h4>
                  <Badge
                    className={`${statusInfo[selectedOrder.status].color} font-normal flex items-center gap-1 w-fit`}
                  >
                    {statusInfo[selectedOrder.status].icon}
                    {statusInfo[selectedOrder.status].label}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Atualizar Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === "preparing" && (
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, "delivering")
                          setSelectedOrder({ ...selectedOrder, status: "delivering" })
                        }}
                      >
                        <Truck className="h-4 w-4" /> Marcar como Em Entrega
                      </Button>
                    )}

                    {(selectedOrder.status === "preparing" || selectedOrder.status === "delivering") && (
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, "delivered")
                          setSelectedOrder({ ...selectedOrder, status: "delivered" })
                        }}
                      >
                        <CheckCircle className="h-4 w-4" /> Marcar como Entregue
                      </Button>
                    )}

                    {(selectedOrder.status === "preparing" || selectedOrder.status === "delivering") && (
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, "cancelled")
                          setSelectedOrder({ ...selectedOrder, status: "cancelled" })
                        }}
                      >
                        <XCircle className="h-4 w-4" /> Cancelar Pedido
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Linha do Tempo</h4>
                  <div className="space-y-3 mt-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Pedido recebido</div>
                        <div className="text-xs text-neutral-500">28/11/2023 18:30</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-3 w-3 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Em preparo</div>
                        <div className="text-xs text-neutral-500">28/11/2023 18:35</div>
                      </div>
                    </div>
                    {selectedOrder.status === "delivering" || selectedOrder.status === "delivered" ? (
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Truck className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Em entrega</div>
                          <div className="text-xs text-neutral-500">28/11/2023 19:05</div>
                        </div>
                      </div>
                    ) : null}
                    {selectedOrder.status === "delivered" ? (
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Entregue</div>
                          <div className="text-xs text-neutral-500">28/11/2023 19:25</div>
                        </div>
                      </div>
                    ) : null}
                    {selectedOrder.status === "cancelled" ? (
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="h-3 w-3 text-red-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Cancelado</div>
                          <div className="text-xs text-neutral-500">28/11/2023 19:10</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOrderDetailsOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => setOrderDetailsOpen(false)}>Imprimir Pedido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

