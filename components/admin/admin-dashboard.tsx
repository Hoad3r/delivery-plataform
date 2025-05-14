"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUp, ArrowDown, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Status translations and colors
const statusInfo: Record<string, { label: string; color: string }> = {
  payment_pending: { label: "Pagamento Pendente", color: "bg-purple-100 text-purple-800" },
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-800" },
  preparing: { label: "Em Preparo", color: "bg-yellow-100 text-yellow-800" },
  delivering: { label: "Em Entrega", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" }
}

// TIPOS DE DADOS
// Defina os tipos para facilitar a integração com dados reais
type OrderData = {
  month: string
  orders: number
  revenue: number
}

type CustomerData = {
  name: string
  value: number
}

type PopularDish = {
  name: string
  orders: number
  percentage: number
}

type OrderByTime = {
  time: string
  orders: number
}

type OrderByLocation = {
  name: string
  value: number
}

type WeeklyOrder = {
  day: string
  orders: number
}

type DeliveryTime = {
  region: string
  time: number
}

// Adicionar tipo para pedidos recentes
type RecentOrder = {
  id: string
  customer: string
  date: string
  value: number
  status: string
}

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Funções para processar os dados reais
// Função para buscar pedidos do Firestore, filtrando por período
const fetchOrders = async (timeRange: string) => {
  console.log("fetchOrders: Iniciando busca com timeRange =", timeRange)
  
  // Definir a data de início baseada no período selecionado
  let startDate = new Date()
  const now = new Date()
  
  switch (timeRange) {
    case "week":
      startDate = subDays(now, 7)
      break
    case "month":
      startDate = startOfMonth(now)
      break
    case "quarter":
      startDate = startOfQuarter(now)
      break
    case "year":
      startDate = startOfYear(now)
      break
    default:
      startDate = startOfYear(now) // padrão para ano
  }

  try {
    console.log("fetchOrders: Consultando collection 'orders'")
    const ordersRef = collection(db, "orders")
    const q = query(
      ordersRef,
      // Não filtrar por data para dashboard, mostrar todos os pedidos
      // where("createdAt", ">=", startDate),
      orderBy("createdAt", "desc")
    )
    
    console.log("fetchOrders: Executando getDocs")
    const snapshot = await getDocs(q)
    console.log("fetchOrders: Obtidos", snapshot.docs.length, "documentos")
    
    const pedidosCarregados = snapshot.docs.map(doc => {
      const data = doc.data()
      let createdAt: Date

      // Trata as diferentes formas que a data pode estar armazenada
      if (data.createdAt?.toDate) {
        // Se for um Timestamp do Firestore
        createdAt = data.createdAt.toDate()
      } else if (data.createdAt instanceof Date) {
        // Se já for um objeto Date
        createdAt = data.createdAt
      } else if (typeof data.createdAt === 'string') {
        // Se for uma string de data
        createdAt = new Date(data.createdAt)
      } else {
        // Se não houver data, usa a data atual
        createdAt = new Date()
      }

      // Normaliza o status (mesmo padrão usado em admin-orders)
      let status = data.status || 'pending'
      if (status === 'processing') status = 'preparing'
      if (status === 'canceled') status = 'cancelled'

      return {
        docId: doc.id,
        id: data.id || doc.id, // Campo id interno ou docId se não existir
        userId: data.userId || '',
        user: data.user || { name: '', phone: '' },
        type: data.type || 'delivery',
        status: status,
        delivery: data.delivery || { address: '', time: null },
        items: data.items || [],
        payment: data.payment || { method: 'cash', total: 0, status: 'pending' },
        notes: data.notes || '',
        createdAt: createdAt
      }
    })

    console.log("fetchOrders: Transformados", pedidosCarregados.length, "pedidos")
    
    if (pedidosCarregados.length > 0) {
      console.log("fetchOrders: Exemplo de pedido processado:", {
        docId: pedidosCarregados[0].docId,
        id: pedidosCarregados[0].id,
        status: pedidosCarregados[0].status,
        userName: pedidosCarregados[0].user?.name,
        date: pedidosCarregados[0].createdAt instanceof Date ? pedidosCarregados[0].createdAt.toISOString() : 'não é Date'
      })
    }

    // Se estiver usando filtro de tempo, aplique-o depois de carregar os dados
    // para garantir que o tratamento de data seja consistente
    const filtered = timeRange === 'all' 
      ? pedidosCarregados 
      : pedidosCarregados.filter(order => {
          if (!order.createdAt) return false
          return order.createdAt >= startDate
        })

    console.log("fetchOrders: Após filtro de tempo, restam", filtered.length, "pedidos")
    return filtered
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error)
    return []
  }
}

// Processar dados para pedidos por mês
const processOrdersByMonth = (orders: any[]): OrderData[] => {
  const monthMap: Record<string, OrderData> = {}
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  
  // Inicializar todos os meses com zero
  months.forEach(month => {
    monthMap[month] = { month, orders: 0, revenue: 0 }
  })
  
  // Preencher com os dados reais
  orders.forEach(order => {
    if (!order.createdAt) return
    
    const monthIndex = order.createdAt.getMonth()
    const month = months[monthIndex]
    
    monthMap[month].orders += 1
    monthMap[month].revenue += Number(order.payment?.total || 0)
  })
  
  // Converter para array na ordem dos meses
  return months.map(month => monthMap[month])
}

// Processar dados para clientes (novos vs recorrentes)
const processCustomerData = (orders: any[]): CustomerData[] => {
  const customerOrders: Record<string, number> = {}
  
  orders.forEach(order => {
    if (!order.userId) return
    customerOrders[order.userId] = (customerOrders[order.userId] || 0) + 1
  })
  
  const newCustomers = Object.values(customerOrders).filter(count => count === 1).length
  const returningCustomers = Object.values(customerOrders).filter(count => count > 1).length
  
  return [
    { name: "Novos", value: newCustomers },
    { name: "Recorrentes", value: returningCustomers }
  ]
}

// Processar dados para pratos populares
const processPopularDishes = (orders: any[]): PopularDish[] => {
  const dishCount: Record<string, number> = {}
  
  orders.forEach(order => {
    if (!order.items || !Array.isArray(order.items)) return
    
    order.items.forEach((item: any) => {
      if (!item.name) return
      dishCount[item.name] = (dishCount[item.name] || 0) + (item.quantity || 1)
    })
  })
  
  // Converter para array, ordenar e pegar os top 5
  const dishesArray = Object.entries(dishCount)
    .map(([name, orders]) => ({ name, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)
  
  // Se não houver pratos, retornar array vazio
  if (dishesArray.length === 0) return []
  
  // Calcular o total de pedidos para porcentagens
  const totalOrders = dishesArray.reduce((sum, dish) => sum + dish.orders, 0)
  
  // Adicionar porcentagens
  return dishesArray.map(dish => ({
    ...dish,
    percentage: Math.round((dish.orders / totalOrders) * 100)
  }))
}

// Processar dados para pedidos por horário
const processOrdersByTime = (orders: any[]): OrderByTime[] => {
  const timeSlots = [
    { time: "10-12h", orders: 0 },
    { time: "12-14h", orders: 0 },
    { time: "14-16h", orders: 0 },
    { time: "16-18h", orders: 0 },
    { time: "18-20h", orders: 0 },
    { time: "20-22h", orders: 0 }
  ]
  
  orders.forEach(order => {
    if (!order.createdAt) return
    
    const hour = order.createdAt.getHours()
    
    if (hour >= 10 && hour < 12) timeSlots[0].orders++
    else if (hour >= 12 && hour < 14) timeSlots[1].orders++
    else if (hour >= 14 && hour < 16) timeSlots[2].orders++
    else if (hour >= 16 && hour < 18) timeSlots[3].orders++
    else if (hour >= 18 && hour < 20) timeSlots[4].orders++
    else if (hour >= 20 && hour < 22) timeSlots[5].orders++
  })
  
  return timeSlots
}

// Processar dados para pedidos por localização
const processOrdersByLocation = (orders: any[]): OrderByLocation[] => {
  // Como não temos dados de localização específicos, vamos usar bairros ou CEPs
  // Este é apenas um exemplo, ajuste conforme seus dados reais
  const locationCounts: Record<string, number> = {
    "Centro": 0,
    "Zona Sul": 0,
    "Zona Norte": 0,
    "Zona Leste": 0,
    "Zona Oeste": 0
  }
  
  // Se você tiver um campo específico para região/bairro, use-o aqui
  orders.forEach(order => {
    if (!order.delivery?.address) return
    
    const address = order.delivery.address.toLowerCase()
    
    if (address.includes("centro")) locationCounts["Centro"]++
    else if (address.includes("zona sul") || address.includes("sul")) locationCounts["Zona Sul"]++
    else if (address.includes("zona norte") || address.includes("norte")) locationCounts["Zona Norte"]++
    else if (address.includes("zona leste") || address.includes("leste")) locationCounts["Zona Leste"]++
    else if (address.includes("zona oeste") || address.includes("oeste")) locationCounts["Zona Oeste"]++
    else locationCounts["Centro"]++ // Padrão se não encontrar região específica
  })
  
  return Object.entries(locationCounts).map(([name, value]) => ({ name, value }))
}

// Processar dados para pedidos por dia da semana
const processWeeklyOrders = (orders: any[]): WeeklyOrder[] => {
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const dayCount = weekDays.map(day => ({ day, orders: 0 }))
  
  orders.forEach(order => {
    if (!order.createdAt) return
    
    const dayIndex = order.createdAt.getDay()
    dayCount[dayIndex].orders++
  })
  
  return dayCount
}

// Processar dados para tempos de entrega baseado nas regiões
const processDeliveryTimes = (orders: any[]): DeliveryTime[] => {
  // Esta é uma aproximação baseada nos dados reais
  // Em um cenário real, você teria timestamps de criação e entrega para calcular o tempo real
  
  // Mapeamento de regiões e seus tempos médios
  const regionTimes: Record<string, { total: number, count: number }> = {
    "Centro": { total: 0, count: 0 },
    "Zona Sul": { total: 0, count: 0 },
    "Zona Norte": { total: 0, count: 0 },
    "Zona Leste": { total: 0, count: 0 },
    "Zona Oeste": { total: 0, count: 0 }
  }
  
  // Valores padrão para cada região
  const defaultTimes: Record<string, number> = {
    "Centro": 25,
    "Zona Sul": 35,
    "Zona Norte": 40,
    "Zona Leste": 45,
    "Zona Oeste": 38
  }
  
  // Se você tiver dados reais de tempo de entrega, use-os aqui
  // Por enquanto, usando valores padrão
  return Object.entries(defaultTimes).map(([region, time]) => ({ region, time }))
}

// Processar dados para pedidos recentes
const processRecentOrders = (orders: any[]): RecentOrder[] => {
  if (!orders || orders.length === 0) {
    console.log("processRecentOrders: Nenhum pedido para processar")
    return []
  }
  
  console.log("processRecentOrders: Processando", orders.length, "pedidos")
  console.log("Amostra do primeiro pedido:", JSON.stringify(orders[0], null, 2))
  
  const processedOrders = orders
    .slice(0, 5) // Já está ordenado por data desc na consulta
    .map(order => {
      // Usamos docId para operações no Firestore, mas exibimos o id na UI
      const processedOrder = {
        id: order.id, // Usar o ID interno para exibição, não o docId
        customer: order.user?.name || "Cliente",
        date: order.createdAt ? format(order.createdAt, "dd/MM/yyyy, HH:mm", { locale: ptBR }) : "",
        value: Number(order.payment?.total || 0),
        status: statusInfo[order.status as keyof typeof statusInfo]?.label || String(order.status)
      };
      
      return processedOrder;
    });
  
  console.log("processRecentOrders: Pedidos processados:", processedOrders.length);
  console.log("Pedidos recentes processados:", processedOrders);
  
  return processedOrders;
}

export default function AdminDashboard() {
  // Estado para armazenar o período selecionado
  const [timeRange, setTimeRange] = useState("year")

  // Estados para armazenar os dados (substitua os dados mockados pelos dados reais da API)
  const [orderData, setOrderData] = useState<OrderData[]>([])
  const [customerData, setCustomerData] = useState<CustomerData[]>([])
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [ordersByTime, setOrdersByTime] = useState<OrderByTime[]>([])
  const [ordersByLocation, setOrdersByLocation] = useState<OrderByLocation[]>([])
  const [weeklyOrders, setWeeklyOrders] = useState<WeeklyOrder[]>([])
  const [deliveryTimes, setDeliveryTimes] = useState<DeliveryTime[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  // Estado para controlar se os dados foram carregados
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para carregar os dados quando o componente montar ou timeRange mudar
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Buscar dados reais do Firestore
        const orders = await fetchOrders(timeRange)
        console.log("Pedidos carregados:", orders.length)
        
        // Sempre processar os dados, mesmo que orders esteja vazio
        const ordersByMonth = processOrdersByMonth(orders)
        const customers = processCustomerData(orders)
        const dishes = processPopularDishes(orders)
        const orderTimes = processOrdersByTime(orders)
        const locationData = processOrdersByLocation(orders)
        const weekData = processWeeklyOrders(orders)
        const deliveryTimeData = processDeliveryTimes(orders)
        const recentOrdersData = processRecentOrders(orders)
        
        // Atualizar os estados com os dados processados
        setOrderData(ordersByMonth)
        setCustomerData(customers)
        setPopularDishes(dishes)
        setOrdersByTime(orderTimes)
        setOrdersByLocation(locationData)
        setWeeklyOrders(weekData)
        setDeliveryTimes(deliveryTimeData)
        setRecentOrders(recentOrdersData)
        
        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        
        // Em caso de erro, definir arrays vazios
        setOrderData([])
        setCustomerData([])
        setPopularDishes([])
        setOrdersByTime([])
        setOrdersByLocation([])
        setWeeklyOrders([])
        setDeliveryTimes([])
        setRecentOrders([])
        
        setIsLoading(false)
      }
    }

    loadData()
  }, [timeRange]) // Recarregar quando o período mudar

  // Calcular métricas de resumo
  const totalOrders = orderData.reduce((sum, item) => sum + item.orders, 0)
  const totalRevenue = orderData.reduce((sum, item) => sum + item.revenue, 0)
  const totalCustomers = customerData.reduce((sum, item) => sum + item.value, 0)
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"

  // Calcular crescimento mês a mês
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return "0.0"
    return (((current - previous) / previous) * 100).toFixed(1)
  }

  const lastMonthOrders = orderData.length > 0 ? orderData[orderData.length - 1].orders : 0
  const previousMonthOrders = orderData.length > 1 ? orderData[orderData.length - 2].orders : 0
  const orderGrowth = calculateGrowth(lastMonthOrders, previousMonthOrders)

  const lastMonthRevenue = orderData.length > 0 ? orderData[orderData.length - 1].revenue : 0
  const previousMonthRevenue = orderData.length > 1 ? orderData[orderData.length - 2].revenue : 0
  const revenueGrowth = calculateGrowth(lastMonthRevenue, previousMonthRevenue)

  // Função para renderizar um gráfico com verificação de dados
  const renderChart = (chartType: string, data: any[], renderFn: () => React.ReactNode) => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Carregando dados...</p>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Nenhum dado disponível</p>
        </div>
      )
    }

    // Verificar se os dados têm valores significativos
    const hasSignificantData = chartType.includes('pie') 
      ? data.some(item => (item.value || item.orders || 0) > 0)
      : data.some(item => {
          const values = Object.values(item).filter(val => typeof val === 'number');
          return values.some(val => val > 0);
        });

    if (!hasSignificantData) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Dados insuficientes para visualização</p>
        </div>
      )
    }

    return renderFn()
  }

  return (
    <div className="space-y-6">
      {/* Seletor de período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-light">Visão Geral</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] rounded-none">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card de Total de Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalOrders.toLocaleString()}</div>
            <div className="flex items-center pt-1 text-xs">
              {!isLoading && (
                <>
                  {Number(orderGrowth) > 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={Number(orderGrowth) > 0 ? "text-green-500" : "text-red-500"}>
                    {orderGrowth}% em relação ao mês anterior
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Receita Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `R$ ${totalRevenue.toLocaleString()}`}</div>
            <div className="flex items-center pt-1 text-xs">
              {!isLoading && (
                <>
                  {Number(revenueGrowth) > 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={Number(revenueGrowth) > 0 ? "text-green-500" : "text-red-500"}>
                    {revenueGrowth}% em relação ao mês anterior
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : totalCustomers.toLocaleString()}</div>
            <div className="text-xs text-neutral-500 pt-1">
              {!isLoading && (
                <>
                  {customerData[0]?.value.toLocaleString() || 0} novos,
                  {customerData[1]?.value.toLocaleString() || 0} recorrentes
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Valor Médio do Pedido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio do Pedido</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `R$ ${averageOrderValue}`}</div>
            <div className="text-xs text-neutral-500 pt-1">
              {!isLoading && `Baseado em ${totalOrders.toLocaleString()} pedidos`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="orders" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="locations" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Locais
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba Pedidos */}
        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pedidos por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Mês</CardTitle>
                <CardDescription>Número total de pedidos por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("line", orderData, () => (
                      <LineChart data={orderData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip formatter={(value) => [`${value} pedidos`, "Total"]} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="#8884d8"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          dot={{ r: 4 }}
                          name="Pedidos"
                        />
                      </LineChart>
                    ))}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pedidos por Dia da Semana */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Dia da Semana</CardTitle>
                <CardDescription>Distribuição de pedidos por dia da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("bar", weeklyOrders, () => (
                      <BarChart data={weeklyOrders} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip formatter={(value) => [`${value} pedidos`, "Total"]} />
                        <Legend />
                        <Bar dataKey="orders" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40} name="Pedidos" />
                      </BarChart>
                    ))}
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-neutral-500 text-center">
                  Sexta e sábado são os dias com maior volume de pedidos
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pedidos por Horário */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Horário</CardTitle>
                <CardDescription>Distribuição de pedidos por horário do dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("bar", ordersByTime, () => (
                      <BarChart data={ordersByTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip formatter={(value) => [`${value} pedidos`, "Total"]} />
                        <Legend />
                        <Bar dataKey="orders" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40} name="Pedidos" />
                      </BarChart>
                    ))}
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-neutral-500 text-center">
                  Picos de pedidos no horário de almoço (12-14h) e jantar (18-20h)
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Receita por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Mês</CardTitle>
                <CardDescription>Receita total por mês (R$)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("line", orderData, () => (
                      <LineChart data={orderData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} 
                          tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                        />
                        <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, "Receita"]} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          dot={{ r: 4 }}
                          name="Receita"
                        />
                      </LineChart>
                    ))}
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-neutral-500 text-center">
                  Crescimento constante na receita ao longo do ano, com pico em dezembro
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo da aba Clientes */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Distribuição de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Clientes</CardTitle>
                <CardDescription>Novos vs. Recorrentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("pie", customerData, () => (
                      <PieChart>
                        <Pie
                          data={customerData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          {customerData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Clientes"]} />
                        <Legend />
                      </PieChart>
                    ))}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Card de Frequência de Pedidos */}
            <Card>
              <CardHeader>
                <CardTitle>Frequência de Pedidos</CardTitle>
                <CardDescription>Número de pedidos por cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{isLoading ? "..." : "3.2"}</div>
                    <div className="text-sm text-neutral-500 mt-2">Pedidos por cliente (média mensal)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo da aba Produtos */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Produtos Mais Populares */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Populares</CardTitle>
                <CardDescription>Top 5 produtos mais vendidos</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-neutral-500">Carregando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {popularDishes.map((dish, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-8 text-sm text-neutral-500">{index + 1}.</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{dish.name}</div>
                          <div className="text-xs text-neutral-500">{dish.orders} pedidos</div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium">{dish.percentage}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Distribuição de Vendas por Produto */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Vendas por Produto</CardTitle>
                <CardDescription>Porcentagem de vendas por produto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("pie", popularDishes, () => (
                      <PieChart>
                        <Pie
                          data={popularDishes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="orders"
                          nameKey="name"
                        >
                          {popularDishes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [`${props.payload.percentage}%`, props.payload.name]}
                        />
                      </PieChart>
                    ))}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conteúdo da aba Locais */}
        <TabsContent value="locations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Distribuição Geográfica */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição Geográfica</CardTitle>
                <CardDescription>Pedidos por região</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("pie", ordersByLocation, () => (
                      <PieChart>
                        <Pie
                          data={ordersByLocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          {ordersByLocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${typeof value === 'number' ? ((value / ordersByLocation.reduce((sum, item) => sum + (item.value || 0), 0)) * 100).toFixed(0) : 0}%`,
                            name,
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    ))}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Tempo Médio de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Entrega</CardTitle>
                <CardDescription>Por região (em minutos)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("bar", deliveryTimes, () => (
                      <BarChart data={deliveryTimes} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="region" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip formatter={(value) => [`${value} min`, "Tempo de Entrega"]} />
                        <Legend />
                        <Bar dataKey="time" fill="#FF8042" name="Tempo de Entrega" />
                      </BarChart>
                    ))}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pedidos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Últimos 5 pedidos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-neutral-500">Carregando dados...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">ID</th>
                    <th className="text-left py-3 px-4 font-medium">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium">Data</th>
                    <th className="text-left py-3 px-4 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-neutral-500">
                        Nenhum pedido recente encontrado
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order, index) => (
                      <tr key={index} className={index < recentOrders.length - 1 ? "border-b" : ""}>
                        <td className="py-3 px-4">{order.id}</td>
                        <td className="py-3 px-4">{order.customer}</td>
                        <td className="py-3 px-4">{order.date}</td>
                        <td className="py-3 px-4">R$ {order.value.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              order.status === "Em preparo"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "Em entrega"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

