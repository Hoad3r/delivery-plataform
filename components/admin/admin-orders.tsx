"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDocs, where, limit, startAfter, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Status translations and colors
const statusInfo = {
  payment_pending: { label: "Pagamento Pendente", color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="h-4 w-4" /> },
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-800", icon: <AlertCircle className="h-4 w-4" /> },
  preparing: { label: "Em Preparo", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  delivering: { label: "Em Entrega", color: "bg-blue-100 text-blue-800", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> }
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

type OrderStatus = "payment_pending" | "pending" | "preparing" | "delivering" | "delivered" | "cancelled";
type OrderType = "delivery" | "pickup";

interface Order {
  docId: string;
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
  statusHistory?: Record<string, any>;
}

type SortableKey = "createdAt" | "status" | "total";

// Status order mapping
const statusOrder = {
  payment_pending: 1,
  pending: 2,
  preparing: 3,
  delivering: 4,
  delivered: 5,
  cancelled: 6
}

export default function AdminOrders() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: "asc" | "desc" }>({ key: "createdAt", direction: "desc" })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Adicionar estados para paginação
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageSize = 20 // Número de pedidos carregados por vez
  
  // Estado para controlar o timer de debounce na busca
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Carrega pedidos iniciais
  useEffect(() => {
    carregarPedidos(true)
  }, [statusFilter, dateFilter])

  // Função para carregar mais pedidos - Otimizada com useCallback
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    carregarPedidos(false)
  }, [hasMore, loadingMore])

  // Função otimizada para carregar pedidos - useCallback para evitar recriações
  const carregarPedidos = useCallback(async (reset: boolean) => {
    // Se estiver carregando inicialmente ou carregando mais
    setIsLoading(reset)
    setLoadingMore(!reset)
    
    try {
      // 1. Construir query base
      const ordersRef = collection(db, 'orders')
      let queryConstraints: any[] = []
      
      // 2. Adicionar filtros de status
      if (statusFilter !== "all") {
        queryConstraints.push(where('status', '==', statusFilter))
      }
      
      // 3. Adicionar filtros de data - adaptados para strings ISO
      const now = new Date()
      
      if (dateFilter === "today") {
        // Cria string ISO para início do dia atual
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayISO = today.toISOString()
        
        // Cria string ISO para fim do dia atual
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowISO = tomorrow.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', todayISO))
        queryConstraints.push(where('createdAt', '<', tomorrowISO))
        
        console.log('Filtrando por hoje (ISO):', todayISO, 'até', tomorrowISO)
      } else if (dateFilter === "yesterday") {
        // Cria string ISO para início de ontem
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayISO = yesterday.toISOString()
        
        // Cria string ISO para fim de ontem (início de hoje)
        const todayISO = today.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', yesterdayISO))
        queryConstraints.push(where('createdAt', '<', todayISO))
        
        console.log('Filtrando por ontem (ISO):', yesterdayISO, 'até', todayISO)
      } else if (dateFilter === "week") {
        // Cria string ISO para 7 dias atrás
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        const weekAgoISO = weekAgo.toISOString()
        
        // String ISO para agora (inclui todos os pedidos até agora)
        const nowISO = now.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', weekAgoISO))
        queryConstraints.push(where('createdAt', '<=', nowISO))
        
        console.log('Filtrando pela última semana (ISO):', weekAgoISO, 'até', nowISO)
      } else if (dateFilter === "month") {
        // Cria string ISO para 30 dias atrás
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        const monthAgoISO = monthAgo.toISOString()
        
        // String ISO para agora
        const nowISO = now.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', monthAgoISO))
        queryConstraints.push(where('createdAt', '<=', nowISO))
        
        console.log('Filtrando pelo último mês (ISO):', monthAgoISO, 'até', nowISO)
      }
      
      // 4. Adicionar ordenação (agora ordenando a string ISO, que funciona bem para datas)
      queryConstraints.push(orderBy('createdAt', 'desc'))
      
      // 5. Adicionar paginação
      if (!reset && lastVisible) {
        // Se estiver carregando mais, usar startAfter
        queryConstraints.push(startAfter(lastVisible))
      }
      
      // 6. Limitar número de resultados
      queryConstraints.push(limit(pageSize))
      
      // 7. Executar a consulta
      const q = query(ordersRef, ...queryConstraints)
      const querySnapshot = await getDocs(q)
        
      // 8. Salvar o último documento para próxima página
      const docs = querySnapshot.docs
      const lastDoc = docs[docs.length - 1]
      setLastVisible(lastDoc || null)
      
      // Verificar se há mais resultados para carregar
      setHasMore(docs.length === pageSize)
      
      // 9. Processar os resultados
      const pedidosCarregados = docs.map(doc => {
        const data = doc.data()
        let createdAt: Date

        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate()
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt)
        } else {
          createdAt = new Date()
        }

        // Normaliza o status
        let status = data.status || 'payment_pending'
        if (status === 'processing') status = 'preparing'
        if (status === 'canceled') status = 'cancelled'

        const order = {
          docId: doc.id,
          id: data.id || doc.id,
          userId: data.userId || '',
          user: data.user || { name: '', phone: '' },
          type: data.type || 'delivery',
          status: status as OrderStatus,
          delivery: data.delivery || { address: '', time: null },
          items: data.items || [],
          payment: data.payment || { method: 'cash', total: 0, status: 'pending' },
          notes: data.notes || '',
          createdAt: createdAt.toISOString(),
          statusHistory: data.statusHistory || {}
        }

        return order as unknown as Order
      })

      // 10. Atualizar o estado
      if (reset) {
        // Resetar lista se for carregamento inicial
        setOrders(pedidosCarregados)
        setFilteredOrders(pedidosCarregados)
      } else {
        // Adicionar à lista existente se estiver carregando mais
        setOrders(prev => [...prev, ...pedidosCarregados])
        setFilteredOrders(prev => [...prev, ...pedidosCarregados])
      }
      
      console.log(`Carregados ${pedidosCarregados.length} pedidos. Há mais? ${hasMore}`)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [statusFilter, dateFilter, lastVisible, pageSize, toast])

  // Handle search com debounce para evitar múltiplas filtragens durante digitação
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)
    
    // Limpar timer anterior se existir
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    
    // Configurar novo timer de debounce (300ms)
    const newTimer = setTimeout(() => {
      if (term === '') {
        setFilteredOrders(orders)
        return
      }
      
      const filtered = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(term) ||
          order.user.name.toLowerCase().includes(term) ||
          order.user.phone.toLowerCase().includes(term)
      )
      
      setFilteredOrders(filtered)
    }, 300)
    
    setSearchDebounceTimer(newTimer)
  }, [orders, searchDebounceTimer])

  // Limpar o timer de debounce quando o componente desmontar
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
    }
  }, [searchDebounceTimer])

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value)
    // Quando o status muda, resetamos para carregar novos pedidos
    setLastVisible(null)
    setHasMore(true)
  }, [])

  const handleDateFilter = useCallback((value: string) => {
    setDateFilter(value)
    // Quando a data muda, resetamos para carregar novos pedidos
    setLastVisible(null)
    setHasMore(true)
  }, [])

  // Handle sorting com useCallback
  const requestSort = useCallback((key: SortableKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })

    const sortedOrders = [...filteredOrders].sort((a, b) => {
      // Tratar especificamente o caso do "total" que está dentro de payment
      let aValue, bValue;
      
      if (key === "total") {
        aValue = a.payment.total;
        bValue = b.payment.total;
      } else {
        aValue = a[key as keyof Order];
        bValue = b[key as keyof Order];
      }
      
      // Lidar com valores undefined
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return direction === "asc" ? -1 : 1
      if (bValue === undefined) return direction === "asc" ? 1 : -1
      
      if (aValue < bValue) {
        return direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredOrders(sortedOrders)
  }, [filteredOrders, sortConfig])

  // Função para salvar uma nova ordem com useCallback
  const saveOrder = useCallback(async (order: Order) => {
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
  }, [toast])

  // Atualiza o status do pedido - versão melhorada com useCallback
  const updateOrderStatus = useCallback(async (orderDocId: string, newStatus: OrderStatus) => {
    try {
      console.log(`Atualizando pedido ${orderDocId} para status: ${newStatus}`);
      
      const now = new Date();
      
      // Dados para atualização
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        // Adiciona a nova entrada de histórico
        [`statusHistory.${newStatus}`]: serverTimestamp()
      };
      
      const orderRef = doc(db, "orders", orderDocId)
      await updateDoc(orderRef, updateData)

      // Após atualizar, recarregue o pedido para ter os dados atualizados
      // incluindo o histórico de status
      if (selectedOrder && selectedOrder.docId === orderDocId) {
        // Recarregar o pedido específico com dados atualizados
        try {
          const updatedOrderDoc = await getDoc(orderRef);
          if (updatedOrderDoc.exists()) {
            const data = updatedOrderDoc.data();
            
            // Convertendo o documento atualizado para o formato Order
            const updatedOrder = {
              ...selectedOrder,
              status: newStatus,
              statusHistory: data.statusHistory || {},
              updatedAt: now.toISOString()
            };
            
            setSelectedOrder(updatedOrder);
            console.log("Pedido selecionado atualizado com histórico:", updatedOrder);
          }
        } catch (error) {
          console.error("Erro ao recarregar pedido atualizado:", error);
        }
      }

      // Atualizar os arrays de pedidos
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.docId === orderDocId ? { ...order, status: newStatus } : order
        )
      )

      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.docId === orderDocId ? { ...order, status: newStatus } : order
        )
      )

      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      })
      
      // Se estiver com filtro de status ativo, pode ser necessário recarregar a lista
      if (statusFilter !== "all") {
        carregarPedidos(true); // Reset para carregar novos pedidos
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      })
    }
  }, [selectedOrder, statusFilter, carregarPedidos, toast])

  // Corrigir a função handleStatusChange para usar o docId diretamente e usar useCallback
  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    // Log para debug
    console.log(`Tentando alterar status do pedido ID: ${orderId} para ${newStatus}`);
    
    // Verificar se está usando ID interno ou docId
    const pedido = orders.find(o => o.id === orderId);
    
    if (!pedido) {
      console.error(`Pedido com ID ${orderId} não encontrado!`);
      toast({
        title: "Erro",
        description: "Pedido não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    if (!pedido.docId) {
      console.error(`DocId não encontrado para pedido ${orderId}`);
      toast({
        title: "Erro",
        description: "ID do documento não encontrado.",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`DocId encontrado: ${pedido.docId}. Atualizando status...`);
    updateOrderStatus(pedido.docId, newStatus);
  }, [orders, updateOrderStatus, toast])

  // View order details com useCallback
  const viewOrderDetails = useCallback((order: Order) => {
    console.log("Visualizando detalhes do pedido:", order.id, "Status atual:", order.status);
    setSelectedOrder(order)
    setOrderDetailsOpen(true)
  }, [])

  // Função para imprimir detalhes do pedido com useCallback
  const handlePrint = useCallback((order: Order) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Imprimir Pedido</title></head><body>')
      printWindow.document.write(`<h2>Pedido ${order.id}</h2>`)
      printWindow.document.write(`<p><strong>Cliente:</strong> ${order.user.name}</p>`)
      printWindow.document.write(`<p><strong>Telefone:</strong> ${order.user.phone}</p>`)
      printWindow.document.write(`<p><strong>Data:</strong> ${formatDate(order.createdAt)}</p>`)
      printWindow.document.write('<h4>Itens:</h4><ul>')
      order.items.forEach(item => {
        printWindow.document.write(`<li>${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}</li>`)
      })
      printWindow.document.write('</ul>')
      printWindow.document.write(`<p><strong>Total:</strong> R$ ${order.payment.total.toFixed(2)}</p>`)
      printWindow.document.write(`<p><strong>Status:</strong> ${statusInfo[order.status].label}</p>`)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.print()
    }
  }, [])

  // Função para contatar cliente via WhatsApp com useCallback
  const handleContact = useCallback((order: Order) => {
    const phone = order.user.phone.replace(/\D/g, '') // Remove caracteres não numéricos
    const url = `https://wa.me/55${phone}`
    window.open(url, '_blank')
  }, [])

  // Processar o histórico de status para a linha do tempo com useMemo
  const getStatusTimeline = useCallback((order: Order) => {
    const timeline = [];
    
    // Sempre adicionar a criação do pedido (a partir do createdAt)
    timeline.push({
      status: 'created',
      label: 'Pedido recebido',
      timestamp: order.createdAt ? new Date(order.createdAt) : new Date(),
      icon: <CheckCircle className="h-3 w-3 text-green-600" />,
      bgColor: 'bg-green-100',
    });
    
    // Adicionar entradas do histórico se disponível
    if (order.statusHistory) {
      // Mapear status para informações na timeline
      const statusEntries = [
        { key: 'payment_pending', label: 'Pagamento pendente', icon: <AlertCircle className="h-3 w-3 text-purple-600" />, bgColor: 'bg-purple-100' },
        { key: 'pending', label: 'Pedido pendente', icon: <AlertCircle className="h-3 w-3 text-orange-600" />, bgColor: 'bg-orange-100' },
        { key: 'preparing', label: 'Em preparo', icon: <Clock className="h-3 w-3 text-yellow-600" />, bgColor: 'bg-yellow-100' },
        { key: 'delivering', label: 'Em entrega', icon: <Truck className="h-3 w-3 text-blue-600" />, bgColor: 'bg-blue-100' },
        { key: 'delivered', label: 'Entregue', icon: <CheckCircle className="h-3 w-3 text-green-600" />, bgColor: 'bg-green-100' },
        { key: 'cancelled', label: 'Cancelado', icon: <XCircle className="h-3 w-3 text-red-600" />, bgColor: 'bg-red-100' },
      ];
      
      // Adicionar cada status que existe no histórico
      statusEntries.forEach(entry => {
        if (order.statusHistory && order.statusHistory[entry.key]) {
          // Converter o timestamp para Date se necessário
          let timestamp;
          const statusTime = order.statusHistory[entry.key];
          
          if (statusTime?.toDate) {
            // Se for um Timestamp do Firestore
            timestamp = statusTime.toDate();
          } else if (statusTime instanceof Date) {
            // Se já for um Date
            timestamp = statusTime;
          } else if (typeof statusTime === 'string') {
            // Se for uma string ISO
            timestamp = new Date(statusTime);
          } else if (statusTime?.seconds) {
            // Se for um objeto Firestore com seconds
            timestamp = new Date(statusTime.seconds * 1000);
          } else {
            // Fallback para data atual
            timestamp = new Date();
          }
          
          timeline.push({
            status: entry.key,
            label: entry.label,
            timestamp,
            icon: entry.icon,
            bgColor: entry.bgColor,
          });
        }
      });
    }
    
    // Ordenar a timeline por timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return timeline;
  }, []);

  // Memoizar a lista filtrada de pedidos com base em orders e searchTerm
  const memoizedFilteredOrders = useMemo(() => {
    // Se estiver carregando, retornar o estado atual
    if (isLoading || loadingMore) return filteredOrders;
    
    // Se não houver termo de busca, retornar todos os pedidos
    if (!searchTerm.trim()) return filteredOrders;
    
    // Filtrar os pedidos com base no termo de busca
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm, isLoading, loadingMore, filteredOrders]);

  // Usar o valor memoizado na renderização
  useEffect(() => {
    if (!isLoading && !loadingMore && searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else if (!isLoading && !loadingMore) {
      setFilteredOrders(memoizedFilteredOrders);
    }
  }, [memoizedFilteredOrders, orders, isLoading, loadingMore, searchTerm]);

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
                <SelectItem value="payment_pending">Pagamento Pendente</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="preparing">Em Preparo</SelectItem>
                <SelectItem value="delivering">Em Entrega</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando pedidos...</p>
            </div>
          ) : (
            <div className="space-y-4">
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

                                  {/* payment_pending: cancelar */}
                                  {order.status === "payment_pending" && (
                                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}> 
                                      <XCircle className="h-4 w-4 mr-2" /> Cancelar Pedido
                                    </DropdownMenuItem>
                                  )}

                                  {/* pending: aceitar (preparing) ou recusar (cancelled) */}
                                  {order.status === "pending" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleStatusChange(order.id, "preparing")}> 
                                        <CheckCircle className="h-4 w-4 mr-2" /> Aceitar Pedido
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}> 
                                        <XCircle className="h-4 w-4 mr-2" /> Recusar Pedido
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* preparing: em entrega, entregue, cancelar */}
                                {order.status === "preparing" && (
                                    <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivering")}>
                                    <Truck className="h-4 w-4 mr-2" /> Marcar como Em Entrega
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivered")}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Entregue
                                  </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}> 
                                        <XCircle className="h-4 w-4 mr-2" /> Cancelar Pedido
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* delivering: entregue, cancelar por não entregue */}
                                  {order.status === "delivering" && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivered")}> 
                                        <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Entregue
                                      </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(order.id, "cancelled")}>
                                        <XCircle className="h-4 w-4 mr-2" /> Cancelar (Não Entregue)
                                  </DropdownMenuItem>
                                    </>
                                )}

                                  {/* delivered/cancelled: apenas ações normais */}
                                  <DropdownMenuItem onClick={() => handlePrint(order)}>
                                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                                </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => handleContact(order)}>
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
              
              {/* Botão para carregar mais */}
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMore} 
                    disabled={loadingMore || isLoading}
                  >
                    {loadingMore ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais pedidos'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
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
                    {selectedOrder.status === "payment_pending" && (
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, "cancelled");
                          // Não fechamos o modal, deixamos o usuário ver a atualização
                        }}
                      >
                        <XCircle className="h-4 w-4" /> Cancelar Pedido
                      </Button>
                    )}

                    {selectedOrder.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "preparing");
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Aceitar Pedido
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "cancelled");
                          }}
                        >
                          <XCircle className="h-4 w-4" /> Recusar Pedido
                        </Button>
                      </>
                    )}

                    {selectedOrder.status === "preparing" && (
                      <>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "delivering");
                          }}
                        >
                          <Truck className="h-4 w-4" /> Marcar como Em Entrega
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "delivered");
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Marcar como Entregue
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "cancelled");
                          }}
                        >
                          <XCircle className="h-4 w-4" /> Cancelar Pedido
                        </Button>
                      </>
                    )}

                    {selectedOrder.status === "delivering" && (
                      <>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "delivered");
                          }}
                        >
                          <CheckCircle className="h-4 w-4" /> Marcar como Entregue
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            handleStatusChange(selectedOrder.id, "cancelled");
                          }}
                        >
                          <XCircle className="h-4 w-4" /> Cancelar (Não Entregue)
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Linha do Tempo</h4>
                  <div className="space-y-3 mt-4">
                    {selectedOrder && getStatusTimeline(selectedOrder).map((item, index) => (
                      <div className="flex gap-3" key={`timeline-${index}`}>
                        <div className={`w-6 h-6 rounded-full ${item.bgColor} flex items-center justify-center`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="text-xs text-neutral-500">
                            {format(item.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOrderDetailsOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => handlePrint(selectedOrder)}>Imprimir Pedido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

