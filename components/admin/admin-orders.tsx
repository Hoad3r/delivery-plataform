"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Search,
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
  Trash2,
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
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDocs, where, limit, startAfter, Timestamp, getDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Status translations and colors
const statusInfo = {
  payment_pending: { label: "Pagamento Pendente", color: "bg-purple-100 text-purple-800", icon: <AlertCircle className="h-4 w-4" /> },
  pending: { label: "Pendente", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-4 w-4" /> },
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
  // Fallback para métodos desconhecidos
  unknown: { label: "Método Desconhecido", icon: "❓" },
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
  email?: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

type PaymentStatus = "paid" | "pending" | "refunded";

interface OrderPayment {
  paymentMethod: "pix" | "credit" | "debit" | "cash";
  subtotal: number;
  deliveryFee: number;
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
  scheduledDate?: string;
  scheduledTime?: string;
}

type SortableKey = "createdAt" | "total";

export default function AdminOrders() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [inputValue, setInputValue] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: "asc" | "desc" }>({ key: "createdAt", direction: "desc" })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Estados para exclusão de pedidos
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Adicionar estados para paginação
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const pageSize = 20 // Número de pedidos carregados por vez
  
  // Carrega pedidos iniciais (apenas para orders)
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
      } else if (dateFilter === "week") {
        // Cria string ISO para 7 dias atrás
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        const weekAgoISO = weekAgo.toISOString()
        
        // String ISO para agora (inclui todos os pedidos até agora)
        const nowISO = now.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', weekAgoISO))
        queryConstraints.push(where('createdAt', '<=', nowISO))
      } else if (dateFilter === "month") {
        // Cria string ISO para 30 dias atrás
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        const monthAgoISO = monthAgo.toISOString()
        
        // String ISO para agora
        const nowISO = now.toISOString()
        
        queryConstraints.push(where('createdAt', '>=', monthAgoISO))
        queryConstraints.push(where('createdAt', '<=', nowISO))
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
        let createdAt = data.createdAt
        
        // Converter serverTimestamp para ISO string
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate().toISOString()
        } else if (createdAt && typeof createdAt === 'object') {
          // Se for um objeto Timestamp do Firestore
          createdAt = new Date(createdAt.seconds * 1000).toISOString()
        } else if (!createdAt) {
          // Se não tiver data, usar a data atual
          createdAt = new Date().toISOString()
        }

        // Normaliza o status
        let status = data.status || 'payment_pending'
        if (status === 'processing') status = 'preparing'
        if (status === 'canceled') status = 'cancelled'

        return {
          docId: doc.id,
          id: data.id || doc.id,
          userId: data.userId || null,
          user: data.user || {},
          type: data.type || 'delivery',
          status,
          items: data.items || [],
          delivery: data.delivery || {},
          payment: data.payment || {},
          notes: data.notes || '',
          createdAt,
          updatedAt: data.updatedAt || createdAt,
          statusHistory: data.statusHistory || {},
          scheduledDate: data.scheduledDate || null,
          scheduledTime: data.scheduledTime || null,
        } as Order
      })

      // 10. Atualizar o estado (apenas orders)
      if (reset) {
        setOrders(pedidosCarregados)
      } else {
        setOrders(prev => [...prev, ...pedidosCarregados])
      }
      
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [statusFilter, dateFilter, lastVisible, hasMore, loadingMore, pageSize, toast])

  // Adicionar useEffect para debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue)
    }, 500) // 500ms de debounce

    return () => clearTimeout(timer)
  }, [inputValue])

  // Atualizar handleSearch para usar inputValue
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  // Handle status filter
  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setLastVisible(null); // Resetar paginação ao mudar filtro
    setHasMore(true);
  }, []);

  // Handle date filter
  const handleDateFilter = useCallback((value: string) => {
    setDateFilter(value);
    setLastVisible(null); // Resetar paginação ao mudar filtro
    setHasMore(true);
  }, []);

  // Refatorar requestSort para atualizar apenas sortConfig
  const requestSort = useCallback((key: SortableKey) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }, [sortConfig])

  // displayedOrders agora é um useMemo que filtra e ordena orders
  const displayedOrders = useMemo(() => {
    let currentOrders = [...orders];

    // 1. Aplicar filtro de busca (apenas busca por texto)
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentOrders = currentOrders.filter(order =>
        order.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        order.user.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        order.user.phone.toLowerCase().includes(lowerCaseSearchTerm) ||
        order.items.some(item => item.name.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    // 2. Aplicar ordenação
    if (sortConfig.key) {
      currentOrders.sort((a, b) => {
        let aValue: any, bValue: any;

        if (sortConfig.key === "total") {
          aValue = a.payment.total;
          bValue = b.payment.total;
        } else if (sortConfig.key === "createdAt") {
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
        }

        // Lidar com valores undefined
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "asc" ? -1 : 1;
        if (bValue === undefined) return sortConfig.direction === "asc" ? 1 : -1;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return currentOrders;
  }, [orders, searchTerm, sortConfig]);

  // Função para salvar uma nova ordem com useCallback
  const saveOrder = useCallback(async (order: Partial<Order>) => {
    try {
      const ordersRef = collection(db, "orders")
      await addDoc(ordersRef, order)
      
      toast({
        title: "Pedido salvo",
        description: `Pedido ${order.id} foi salvo com sucesso!`,
      })
      carregarPedidos(true) // Recarrega os pedidos para incluir o novo
    } catch (error) {
      console.error("Erro ao salvar pedido:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pedido.",
        variant: "destructive",
      })
    }
  }, [carregarPedidos, toast])

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
      if (selectedOrder && selectedOrder.docId === orderDocId) {
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
            console.log("Pedido atualizado:", updatedOrder);

            // Enviar email de atualização de status
            const customerEmail = updatedOrder.user.email;
            
            if (customerEmail) {
              try {
                const response = await fetch('/api/send-email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: customerEmail,
                    subject: `📋 Atualização do Pedido #${updatedOrder.id} - ${statusInfo[newStatus].label}`,
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f8fafc;">
                        <div style="text-align: center; margin-bottom: 20px;">
                          <h1 style="color: #1e40af; margin: 0;">📋 ATUALIZAÇÃO DO PEDIDO</h1>
                          <p style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${updatedOrder.id}</p>
                        </div>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; margin-bottom: 20px;">
                          <h2 style="color: #1e293b; margin-top: 0;">🔄 Status Atualizado</h2>
                          <p style="font-size: 16px; color: #374151;">Seu pedido foi atualizado para: <strong style="color: #1e40af;">${statusInfo[newStatus].label}</strong></p>
                        </div>

                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                          <h3 style="color: #1e293b; margin-top: 0;">📋 Seu Pedido:</h3>
                          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                            <ul style="list-style: none; padding: 0; margin: 0;">
                              ${updatedOrder.items.map(item => `
                                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                                  <span><strong>${item.quantity}x</strong> ${item.name}</span>
                                  <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                              `).join('')}
                            </ul>
                          </div>
                        </div>

                                          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">💰 Informações do Pedido:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <strong>Subtotal:</strong> R$ ${updatedOrder.payment.subtotal?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <strong>Taxa de Entrega:</strong> R$ ${updatedOrder.payment.deliveryFee?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <strong>Total:</strong> R$ ${updatedOrder.payment.total.toFixed(2)}
                      </div>
                      <div>
                        <strong>Método:</strong> ${paymentMethodInfo[updatedOrder.payment.paymentMethod]?.label || paymentMethodInfo.unknown.label}
                      </div>
                      <div>
                        <strong>Status:</strong> <span style="color: #1e40af; font-weight: bold;">${statusInfo[newStatus].label}</span>
                      </div>
                      <div>
                        <strong>Entrega:</strong> ${updatedOrder.type === 'delivery' ? 'Entrega' : 'Retirada'}
                      </div>
                    </div>
                  </div>

                        ${updatedOrder.notes ? `
                          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                            <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${updatedOrder.notes}</p>
                          </div>
                        ` : ''}

                        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                          <h3 style="color: #1e40af; margin-top: 0;">📊 STATUS ATUALIZADO</h3>
                          <p style="color: #1e40af; font-size: 16px; font-weight: bold; margin: 0;">
                            ${statusInfo[newStatus].label}
                          </p>
                          <p style="color: #1e40af; font-size: 14px; margin: 5px 0 0 0;">
                            Seu pedido foi atualizado com sucesso!
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

                if (!response.ok) {
                  throw new Error('Falha ao enviar email');
                }

                toast({
                  title: "Email enviado",
                  description: "O cliente foi notificado sobre a atualização do status.",
                });
              } catch (error) {
                console.error('Erro ao enviar email:', error);
                toast({
                  title: "Aviso",
                  description: "O status foi atualizado, mas houve um erro ao enviar o email.",
                  variant: "destructive",
                });
              }
            } else {
              console.log('Cliente não possui email cadastrado');
              toast({
                title: "Aviso",
                description: "O status foi atualizado, mas o cliente não possui email cadastrado.",
              });
            }
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
  const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
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
    
    try {
      // Atualizar o status no banco
      await updateOrderStatus(pedido.docId, newStatus);

      // Enviar email de atualização
      if (pedido.user.email) {
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: pedido.user.email,
              subject: `📋 Atualização do Pedido #${pedido.id} - ${statusInfo[newStatus].label}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f8fafc;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #1e40af; margin: 0;">📋 ATUALIZAÇÃO DO PEDIDO</h1>
                    <p style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${pedido.id}</p>
                  </div>
                  
                  <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; margin-bottom: 20px;">
                    <h2 style="color: #1e293b; margin-top: 0;">🔄 Status Atualizado</h2>
                    <p style="font-size: 16px; color: #374151;">Seu pedido foi atualizado para: <strong style="color: #1e40af;">${statusInfo[newStatus].label}</strong></p>
                  </div>

                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">📋 Seu Pedido:</h3>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                      <ul style="list-style: none; padding: 0; margin: 0;">
                        ${pedido.items.map(item => `
                          <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                            <span><strong>${item.quantity}x</strong> ${item.name}</span>
                            <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  </div>

                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">💰 Informações do Pedido:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <strong>Subtotal:</strong> R$ ${pedido.payment.subtotal?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <strong>Taxa de Entrega:</strong> R$ ${pedido.payment.deliveryFee?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <strong>Total:</strong> R$ ${pedido.payment.total.toFixed(2)}
                      </div>
                      <div>
                        <strong>Método:</strong> ${paymentMethodInfo[pedido.payment.paymentMethod]?.label || paymentMethodInfo.unknown.label}
                      </div>
                      <div>
                        <strong>Status:</strong> <span style="color: #1e40af; font-weight: bold;">${statusInfo[newStatus].label}</span>
                      </div>
                      <div>
                        <strong>Entrega:</strong> ${pedido.type === 'delivery' ? 'Entrega' : 'Retirada'}
                      </div>
                    </div>
                  </div>

                  ${pedido.notes ? `
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                      <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${pedido.notes}</p>
                    </div>
                  ` : ''}

                  <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                    <h3 style="color: #1e40af; margin-top: 0;">📊 STATUS ATUALIZADO</h3>
                    <p style="color: #1e40af; font-size: 16px; font-weight: bold; margin: 0;">
                      ${statusInfo[newStatus].label}
                    </p>
                    <p style="color: #1e40af; font-size: 14px; margin: 5px 0 0 0;">
                      Seu pedido foi atualizado com sucesso!
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

          if (!response.ok) {
            throw new Error('Falha ao enviar email');
          }

          toast({
            title: "Email enviado",
            description: "O cliente foi notificado sobre a atualização do status.",
          });
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          toast({
            title: "Aviso",
            description: "O status foi atualizado, mas houve um erro ao enviar o email.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Cliente não possui email cadastrado');
        toast({
          title: "Aviso",
          description: "O status foi atualizado, mas o cliente não possui email cadastrado.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
        variant: "destructive",
      });
    }
  }, [orders, updateOrderStatus, toast]);

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
      printWindow.document.write(`<p><strong>Subtotal:</strong> R$ ${order.payment.subtotal?.toFixed(2) || '0.00'}</p>`)
      printWindow.document.write(`<p><strong>Taxa de entrega:</strong> R$ ${order.payment.deliveryFee?.toFixed(2) || '0.00'}</p>`)
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

  // Função para excluir pedido com useCallback
  const handleDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      console.log(`Excluindo pedido ${orderToDelete.id} (docId: ${orderToDelete.docId})`)
      
      // Excluir o documento do Firestore
      const orderRef = doc(db, "orders", orderToDelete.docId)
      await deleteDoc(orderRef)
      
      // Remover o pedido da lista local
      setOrders(prevOrders => prevOrders.filter(order => order.docId !== orderToDelete.docId))
      
      // Fechar o diálogo e limpar o estado
      setDeleteDialogOpen(false)
      setOrderToDelete(null)
      
      toast({
        title: "Pedido excluído",
        description: `Pedido #${orderToDelete.id} foi excluído com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao excluir pedido:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pedido. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }, [orderToDelete, toast])

  // Função para abrir diálogo de confirmação de exclusão
  const openDeleteDialog = useCallback((order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
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

  // Usar o valor memoizado na renderização
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar por ID, cliente ou telefone..."
              value={inputValue}
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
          <CardDescription>{displayedOrders.length} pedidos encontrados</CardDescription>
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
                      <div className="flex items-center cursor-pointer" onClick={() => requestSort("createdAt")}>Data</div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Agendamento</th>
                    <th className="text-left py-3 px-4 font-medium">
                      <div className="flex items-center cursor-pointer" onClick={() => requestSort("total")}>Valor</div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Pagamento</th>
                    <th className="text-left py-3 px-4 font-medium">Entrega</th>
                    <th className="text-center py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-neutral-500">
                        Nenhum pedido encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map((order) => (
                      <tr key={order.docId} className="border-b hover:bg-neutral-50">
                        <td className="py-3 px-4 font-medium">{order.id}</td>
                        <td className="py-3 px-4">
                          <div>{order.user.name}</div>
                          <div className="text-xs text-neutral-500">{order.user.phone}</div>
                        </td>
                        <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">
                          {order.scheduledDate || order.scheduledTime ? (
                            <div className="flex flex-col text-xs">
                              {order.scheduledDate && <span>Data: {order.scheduledDate}</span>}
                              {order.scheduledTime && <span>Horário: {order.scheduledTime}</span>}
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>Total: R$ {order.payment.total.toFixed(2)}</div>
                            <div className="text-xs text-neutral-500">
                              Subtotal: R$ {order.payment.subtotal?.toFixed(2) || '0.00'} | 
                              Taxa: R$ {order.payment.deliveryFee?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </td>
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
                            <span>{paymentMethodInfo[order.payment.paymentMethod]?.icon || paymentMethodInfo.unknown.icon}</span>
                            <span className="text-xs">{paymentMethodInfo[order.payment.paymentMethod]?.label || paymentMethodInfo.unknown.label}</span>
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

                                  {/* cancelled: opção de exclusão */}
                                  {order.status === "cancelled" && (
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(order)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Excluir Pedido
                                    </DropdownMenuItem>
                                  )}
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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div>Subtotal</div>
                      <div>R$ {selectedOrder.payment.subtotal?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="flex justify-between">
                      <div>Taxa de entrega</div>
                      <div>R$ {selectedOrder.payment.deliveryFee?.toFixed(2) || '0.00'}</div>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <div>Total</div>
                      <div>R$ {selectedOrder.payment.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Método de Pagamento</h4>
                  <div className="flex items-center gap-2">
                    <span>{paymentMethodInfo[selectedOrder.payment.paymentMethod]?.icon || paymentMethodInfo.unknown.icon}</span>
                    <span>{paymentMethodInfo[selectedOrder.payment.paymentMethod]?.label || paymentMethodInfo.unknown.label}</span>
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
                    {(selectedOrder.scheduledDate || selectedOrder.scheduledTime) && (
                      <div>
                        <span className="text-neutral-500 text-sm">Agendamento:</span>
                        <div>
                          {selectedOrder.scheduledDate && <span>Data: {selectedOrder.scheduledDate}</span>}
                          {selectedOrder.scheduledTime && <span className="ml-2">Horário: {selectedOrder.scheduledTime}</span>}
                        </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <div className="text-sm text-muted-foreground">
              <p>Tem certeza que deseja excluir o pedido #{orderToDelete?.id}?</p>
              <br />
              <p><strong>Esta ação não pode ser desfeita.</strong></p>
              <br />
              <div className="bg-red-50 border border-red-200 rounded-sm p-3">
                <div className="text-sm text-red-800">
                  <strong>Cliente:</strong> {orderToDelete?.user.name}
                </div>
                <div className="text-sm text-red-800">
                  <strong>Data:</strong> {orderToDelete ? formatDate(orderToDelete.createdAt) : ''}
                </div>
                <div className="text-sm text-red-800">
                  <strong>Total:</strong> R$ {orderToDelete?.payment.total.toFixed(2)}
                </div>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false)
                setOrderToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteOrder}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

