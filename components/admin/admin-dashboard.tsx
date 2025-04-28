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

// DADOS MOCKADOS
// Substitua estes dados pelos dados reais da sua API
// Exemplo: const fetchOrderData = async () => { const response = await fetch('/api/orders/monthly'); return response.json(); }

// Dados de pedidos mensais
const mockOrderData: OrderData[] = [
  { month: "Jan", orders: 342, revenue: 15680 },
  { month: "Fev", orders: 385, revenue: 17920 },
  { month: "Mar", orders: 406, revenue: 19450 },
  { month: "Abr", orders: 428, revenue: 20760 },
  { month: "Mai", orders: 470, revenue: 22890 },
  { month: "Jun", orders: 512, revenue: 25340 },
  { month: "Jul", orders: 498, revenue: 24650 },
  { month: "Ago", orders: 534, revenue: 26780 },
  { month: "Set", orders: 557, revenue: 28120 },
  { month: "Out", orders: 612, revenue: 31240 },
  { month: "Nov", orders: 645, revenue: 33450 },
  { month: "Dez", orders: 687, revenue: 36280 },
]

// Dados de clientes
const mockCustomerData: CustomerData[] = [
  { name: "Novos", value: 1240 },
  { name: "Recorrentes", value: 3680 },
]

// Cores para os gráficos
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

// Dados de pratos populares
const mockPopularDishes: PopularDish[] = [
  { name: "Marmita Tradicional P", orders: 1850, percentage: 28 },
  { name: "Marmita Executiva", orders: 1420, percentage: 22 },
  { name: "Marmita Fitness", orders: 1280, percentage: 19 },
  { name: "Marmita Vegetariana", orders: 980, percentage: 15 },
  { name: "Marmita Low Carb", orders: 780, percentage: 12 },
]

// Dados de pedidos por horário
const mockOrdersByTime: OrderByTime[] = [
  { time: "10-12h", orders: 245 },
  { time: "12-14h", orders: 1280 },
  { time: "14-16h", orders: 560 },
  { time: "16-18h", orders: 420 },
  { time: "18-20h", orders: 1680 },
  { time: "20-22h", orders: 890 },
]

// Dados de pedidos por localização
const mockOrdersByLocation: OrderByLocation[] = [
  { name: "Centro", value: 35 },
  { name: "Zona Sul", value: 25 },
  { name: "Zona Norte", value: 15 },
  { name: "Zona Leste", value: 10 },
  { name: "Zona Oeste", value: 15 },
]

// Dados de pedidos semanais
const mockWeeklyOrders: WeeklyOrder[] = [
  { day: "Dom", orders: 580 },
  { day: "Seg", orders: 340 },
  { day: "Ter", orders: 385 },
  { day: "Qua", orders: 425 },
  { day: "Qui", orders: 460 },
  { day: "Sex", orders: 720 },
  { day: "Sáb", orders: 680 },
]

// Dados de tempo de entrega
const mockDeliveryTimes: DeliveryTime[] = [
  { region: "Centro", time: 25 },
  { region: "Zona Sul", time: 35 },
  { region: "Zona Norte", time: 40 },
  { region: "Zona Leste", time: 45 },
  { region: "Zona Oeste", time: 38 },
]

// Dados de pedidos recentes
const mockRecentOrders = [
  { id: "#12345", customer: "João Silva", date: "Hoje, 14:30", value: 68.9, status: "Em preparo" },
  { id: "#12344", customer: "Maria Oliveira", date: "Hoje, 13:15", value: 42.5, status: "Em entrega" },
  { id: "#12343", customer: "Pedro Santos", date: "Hoje, 12:45", value: 85.0, status: "Entregue" },
  { id: "#12342", customer: "Ana Souza", date: "Hoje, 11:20", value: 56.7, status: "Entregue" },
  { id: "#12341", customer: "Carlos Ferreira", date: "Hoje, 10:05", value: 39.9, status: "Entregue" },
]

export default function AdminDashboard() {
  // Estado para armazenar o período selecionado
  const [timeRange, setTimeRange] = useState("year")

  // Estados para armazenar os dados (substitua os dados mockados pelos dados reais da API)
  const [orderData, setOrderData] = useState<OrderData[]>(mockOrderData)
  const [customerData, setCustomerData] = useState<CustomerData[]>(mockCustomerData)
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>(mockPopularDishes)
  const [ordersByTime, setOrdersByTime] = useState<OrderByTime[]>(mockOrdersByTime)
  const [ordersByLocation, setOrdersByLocation] = useState<OrderByLocation[]>(mockOrdersByLocation)
  const [weeklyOrders, setWeeklyOrders] = useState<WeeklyOrder[]>(mockWeeklyOrders)
  const [deliveryTimes, setDeliveryTimes] = useState<DeliveryTime[]>(mockDeliveryTimes)
  const [recentOrders, setRecentOrders] = useState(mockRecentOrders)

  // Estado para controlar se os dados foram carregados
  const [isLoading, setIsLoading] = useState(true)

  // Efeito para carregar os dados quando o componente montar
  useEffect(() => {
    // Simulação de carregamento de dados
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Aqui você faria as chamadas para sua API
        // Exemplo:
        // const ordersResponse = await fetch('/api/orders/monthly');
        // const ordersData = await ordersResponse.json();
        // setOrderData(ordersData);

        // Simulando um atraso para carregar os dados
        setTimeout(() => {
          // Usando dados mockados por enquanto
          setOrderData(mockOrderData)
          setCustomerData(mockCustomerData)
          setPopularDishes(mockPopularDishes)
          setOrdersByTime(mockOrdersByTime)
          setOrdersByLocation(mockOrdersByLocation)
          setWeeklyOrders(mockWeeklyOrders)
          setDeliveryTimes(mockDeliveryTimes)
          setRecentOrders(mockRecentOrders)

          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
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
  const renderChart = (chartType: string, data: any[], renderFn: () => JSX.Element) => {
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
                        <YAxis domain={[300, "auto"]} />
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
                        <YAxis domain={[0, 800]} />
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
                        <YAxis domain={[0, 2000]} />
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
                        <YAxis domain={[15000, "auto"]} />
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
                            `${((value / ordersByLocation.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%`,
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
                        <YAxis />
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
                  {recentOrders.map((order, index) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

