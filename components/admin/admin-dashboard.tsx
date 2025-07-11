"use client"

import { useEffect, useState, useCallback, useMemo, ReactElement, JSXElementConstructor, Suspense, lazy } from "react"
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
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUp, ArrowDown, Filter, Download, Coffee, Clock, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfMonth, endOfQuarter, endOfYear, subDays, subMonths, subYears } from "date-fns"
import { ptBR } from "date-fns/locale"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { 
  Popover, 
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

// Importar componentes otimizados
import { LazyChart, TrendPrediction } from "./lazy-charts"

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

// Função utilitária para normalizar datas do Firestore
const normalizeFirestoreDate = (dateValue: any): Date => {
  if (dateValue?.toDate) {
    // Se for um Timestamp do Firestore
    return dateValue.toDate();
  } else if (dateValue instanceof Date) {
    // Se já for um objeto Date
    return dateValue;
  } else if (typeof dateValue === 'string') {
    // Se for uma string de data
    return new Date(dateValue);
  } else if (dateValue?.seconds) {
    // Se for um objeto Firestore com seconds
    return new Date(dateValue.seconds * 1000);
  } else {
    // Se não houver data, usa a data atual
    return new Date();
  }
}

// Dicionário de termos para identificar partes do endereço
const ADDRESS_TERMS = {
  ignored: ['apto', 'apartamento', 'ap', 'bloco', 'bl', 'andar', 'casa', 'residencial', 'condomínio', 'cond'],
  bairroIndicators: ['bairro', 'jardim', 'jd', 'parque', 'pq', 'vila', 'conj']
};

// Função para extrair bairro de um endereço
const extractDistrictFromAddress = (address: string): string => {
  if (!address) return 'Outros';
  
  const parts = address.split(',').map((part: string) => part.trim());
  let bairro = 'Outros'; // Valor padrão
  
  // Primeiro procura por termos indicadores de bairro
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    // Verifica se contém indicadores explícitos de bairro
    const isBairroExplicit = ADDRESS_TERMS.bairroIndicators.some(term => 
      part.includes(term) || (i > 0 && parts[i-1].toLowerCase().includes('bairro'))
    );
    
    if (isBairroExplicit) {
      bairro = parts[i];
      return bairro;
    }
  }
  
  // Se não encontrou um indicador explícito, procura pelo padrão (geralmente terceiro elemento)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    
    // Ignora se for apartamento, bloco, número, etc.
    const shouldIgnore = ADDRESS_TERMS.ignored.some(term => part.includes(term)) || 
                        /^\d+$/.test(part) || // Apenas números
                        part.length < 3;      // Muito curto para ser um bairro
    
    if (shouldIgnore) {
      continue;
    }
    
    // Provavelmente é um bairro se não for o primeiro ou segundo elemento
    if (i >= 2) {
      bairro = parts[i];
      break;
    }
  }
  
  return bairro;
}

// Função para buscar pedidos do Firestore, filtrando por período
const fetchOrders = async (timeRange: string, startDate?: Date) => {
  // Definir a data de início baseada no período selecionado
  let startDateValue = new Date()
  const now = new Date()
  
  switch (timeRange) {
    case "week":
      startDateValue = subDays(now, 7)
      break
    case "month":
      startDateValue = startOfMonth(now)
      break
    case "quarter":
      startDateValue = startOfQuarter(now)
      break
    case "year":
      startDateValue = startOfYear(now)
      break
    default:
      startDateValue = startOfYear(now) // padrão para ano
  }

  try {
    const ordersRef = collection(db, "orders")
    const q = query(
      ordersRef,
      // Não filtrar por data para dashboard, mostrar todos os pedidos
      // where("createdAt", ">=", startDate),
      orderBy("createdAt", "desc")
    )
    
    const snapshot = await getDocs(q)
    
    const pedidosCarregados = snapshot.docs.map(doc => {
      const data = doc.data()
      
      // Usar a função utilitária para normalizar a data
      const createdAt = normalizeFirestoreDate(data.createdAt);

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
        createdAt: createdAt,
        statusHistory: data.statusHistory || {}
      }
    })
    
    console.log(`Total de pedidos carregados: ${pedidosCarregados.length}`);
    console.log("Status dos pedidos:", pedidosCarregados.map(p => p.status));
    
    // Filtrar para considerar apenas pedidos entregues
    const completedOrders = pedidosCarregados.filter(order => order.status === 'delivered')
    
    console.log(`Pedidos entregues: ${completedOrders.length}`);

    // Se estiver usando filtro de tempo, aplique-o depois de carregar os dados
    // para garantir que o tratamento de data seja consistente
    const filtered = timeRange === 'all' 
      ? completedOrders 
      : completedOrders.filter(order => {
          if (!order.createdAt) return false
          return order.createdAt >= startDateValue
        })

    console.log(`Pedidos filtrados por período: ${filtered.length}`);
    return filtered
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error)
    return []
  }
}

// Processar dados para pedidos por mês usando useMemo no componente
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
    
    // order.createdAt já é um objeto Date normalizado pela função normalizeFirestoreDate
    const orderDate = order.createdAt
    const monthIndex = orderDate.getMonth()
    const month = months[monthIndex]
    
    monthMap[month].orders += 1
    // Usar o total que já inclui subtotal + taxa de entrega
    monthMap[month].revenue += Number(order.payment?.total || 0)
  })
  
  // Converter para array na ordem dos meses
  return months.map(month => monthMap[month])
}

// Função para processar clientes (novos vs recorrentes)
const processCustomerData = (orders: any[], allCustomerCounts: Record<string, number>): CustomerData[] => {
  // Identificar clientes únicos no período filtrado
  const customersInPeriod: Record<string, boolean> = {};
  

  
  orders.forEach(order => {
    // Para usuários autenticados, usar userId
    if (order.userId) {
      customersInPeriod[order.userId] = true;
    } else {
      // Para usuários não autenticados, usar email ou telefone como identificador
      const customerId = order.user?.email || order.user?.phone || `guest_${order.id}`;
      customersInPeriod[customerId] = true;
    }
  });
  
  // Lista de IDs dos clientes que fizeram pedidos no período
  const customerIds = Object.keys(customersInPeriod);
  

  
  // Contar novos vs recorrentes baseado no histórico completo
  const newCustomers = customerIds.filter(customerId => 
    !allCustomerCounts[customerId] || allCustomerCounts[customerId] === 1
  ).length;
  
  const returningCustomers = customerIds.filter(customerId => 
    allCustomerCounts[customerId] && allCustomerCounts[customerId] > 1
  ).length;
  

  
  return [
    { name: "Novos", value: newCustomers },
    { name: "Recorrentes", value: returningCustomers }
  ];
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
  // Inicializar slots de tempo padrão
  const timeSlots = [
    { time: "10-12h", orders: 0 },
    { time: "12-14h", orders: 0 },
    { time: "14-16h", orders: 0 },
    { time: "16-18h", orders: 0 },
    { time: "18-20h", orders: 0 },
    { time: "20-22h", orders: 0 }
  ]
  
  // Para capturar horários fora do intervalo padrão
  const extraHours: Record<string, number> = {};
  
  orders.forEach(order => {
    if (!order.createdAt) return;
    
    // order.createdAt já é um objeto Date normalizado pela função normalizeFirestoreDate
    const orderDate = order.createdAt
    const hour = orderDate.getHours()
    
    if (hour >= 10 && hour < 12) timeSlots[0].orders++
    else if (hour >= 12 && hour < 14) timeSlots[1].orders++
    else if (hour >= 14 && hour < 16) timeSlots[2].orders++
    else if (hour >= 16 && hour < 18) timeSlots[3].orders++
    else if (hour >= 18 && hour < 20) timeSlots[4].orders++
    else if (hour >= 20 && hour < 22) timeSlots[5].orders++
    else {
      // Capturar horários fora do intervalo padrão
      const hourRange = `${hour}h-${hour+1}h`;
      extraHours[hourRange] = (extraHours[hourRange] || 0) + 1;
    }
  })
  
  // Adicionar horários extras se houver
  const result = [...timeSlots];
  Object.entries(extraHours).forEach(([timeRange, count]) => {
    result.push({ time: timeRange, orders: count });
  });
  
  return result;
}

// Processar dados para pedidos por dia da semana
const processWeeklyOrders = (orders: any[]): WeeklyOrder[] => {
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const dayCount = weekDays.map(day => ({ day, orders: 0 }))
  
  orders.forEach(order => {
    if (!order.createdAt) return
    
    // order.createdAt já é um objeto Date normalizado pela função normalizeFirestoreDate
    const orderDate = order.createdAt
    const dayIndex = orderDate.getDay()
    dayCount[dayIndex].orders++
  })
  
  return dayCount
}

// Processar dados para tempos de entrega baseado nas regiões
const processDeliveryTimes = (orders: any[]): DeliveryTime[] => {
  // Objeto para armazenar tempos por bairro
  const bairroTimes: Record<string, {total: number, count: number}> = {}
  
  orders.forEach(order => {
    if (!order.delivery?.address || !order.statusHistory) return
    
    // Usar a função otimizada para extrair bairro
    const bairro = extractDistrictFromAddress(order.delivery.address);
    
    // Verificar se temos timestamps de preparing e delivered
    const preparingTime = order.statusHistory.preparing;
    const deliveredTime = order.statusHistory.delivered;
    
    if (preparingTime && deliveredTime) {
      // Converter para Date usando nossa função utilitária
      const startTime = new Date(preparingTime);
      const endTime = new Date(deliveredTime);
      
      // Calcular diferença em minutos
      const diffMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      // Filtrar tempos negativos ou absurdos (mais de 3 horas)
      if (diffMinutes <= 0 || diffMinutes > 180) return;
      
      // Adicionar ao objeto de tempos
      if (!bairroTimes[bairro]) {
        bairroTimes[bairro] = {total: 0, count: 0};
      }
      bairroTimes[bairro].total += diffMinutes;
      bairroTimes[bairro].count += 1;
    }
  });
  
  // Calcular médias e converter para formato do gráfico
  const result = Object.entries(bairroTimes)
    .map(([region, data]) => ({
      region,
      time: data.count > 0 ? Math.round(data.total / data.count) : 0
    }))
    .filter(item => item.time > 0) // Remover bairros sem dados de tempo
    .sort((a, b) => b.time - a.time); // Ordenar por tempo (maior para menor)
  
  // Se não houver dados reais suficientes, retornar dados fictícios
  if (result.length < 2) {
    console.log("Dados de entrega insuficientes, usando valores padrão");
    return [
      { region: "Média geral", time: 30 }
    ];
  }
  
  return result.slice(0, 5); // Limitar a 5 regiões para melhor visualização
}

// Processar dados para pedidos recentes
const processRecentOrders = (orders: any[]): RecentOrder[] => {
  if (!orders || orders.length === 0) {
    return []
  }
  
  const processedOrders = orders
    .slice(0, 5) // Já está ordenado por data desc na consulta
    .map(order => {
      // order.createdAt já é um objeto Date normalizado pela função normalizeFirestoreDate
      const orderDate = order.createdAt || new Date();
      
      // Usamos docId para operações no Firestore, mas exibimos o id na UI
      const processedOrder = {
        id: order.id, // Usar o ID interno para exibição, não o docId
        customer: order.user?.name || "Cliente",
        date: format(orderDate, "dd/MM/yyyy, HH:mm", { locale: ptBR }),
        value: Number(order.payment?.total || 0),
        status: statusInfo[order.status as keyof typeof statusInfo]?.label || String(order.status)
      };
      
      return processedOrder;
    });
  
  return processedOrders;
}

// Função para exportar dados para Excel (melhorada)
const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  // Adicionar cabeçalhos específicos para Excel (BOM para suporte a UTF-8)
  const BOM = "\uFEFF";
  
  // Converter dados para formato CSV com formatação melhorada
  const headers = Object.keys(data[0]).join(';');
  const rows = data.map(item => {
    return Object.values(item).map(value => {
      // Formatar números com casas decimais quando necessário
      if (typeof value === 'number') {
        // Para valores monetários (verifica se alguma chave de valor tem 'total', 'valor', etc)
        if (Object.keys(item).some(key => 
          key.toLowerCase().includes('total') || 
          key.toLowerCase().includes('valor') || 
          key.toLowerCase().includes('revenue'))) {
          return `"${value.toFixed(2)}"`.replace('.', ',');
        }
        return `"${value}"`;
      }
      // Colocar textos entre aspas para evitar problemas com delimitadores
      return `"${value}"`;
    }).join(';');
  });
  
  const csv = BOM + [headers, ...rows].join('\n');
  
  // Criar blob e link para download
  // Usar tipo específico para Excel reconhecer automaticamente
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Nome do arquivo com data formatada
  const formattedDate = format(new Date(), 'dd-MM-yyyy');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formattedDate}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Componente para botão de exportação reutilizável
type ExportButtonProps = {
  data: any[];
  filename: string;
  label?: string;
  className?: string;
}

const ExportButton = ({ data, filename, label, className }: ExportButtonProps) => (
  <Button 
    variant="outline" 
    size="sm"
    className={className || "gap-1"}
    onClick={() => exportToExcel(data, filename)}
    title="Exportar para Excel"
  >
    <Download className="h-4 w-4" />
    {label && <span>{label}</span>}
  </Button>
);

// Adicione essa função antes do useEffect que carrega os dados
const combineDataForComparison = (currentData: any[], compareData: any[], keyField: string) => {
  if (!currentData || !compareData || currentData.length === 0) {
    return currentData;
  }
  
  // Criar um mapa dos dados de comparação para facilitar o acesso
  const compareMap = new Map();
  compareData.forEach(item => {
    if (item[keyField]) {
      compareMap.set(item[keyField], item);
    }
  });
  
  // Combinar dados atuais com dados de comparação
  return currentData.map(current => {
    const key = current[keyField];
    const compare = compareMap.get(key);
    
    return {
      ...current,
      compareOrders: compare?.orders || 0,
      compareRevenue: compare?.revenue || 0,
      compareTime: compare?.time || 0,
      compareValue: compare?.value || 0
    };
  });
};

// Função para calcular crescimento entre períodos
const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return "0.0";
  return (((current - previous) / previous) * 100).toFixed(1);
};

// Processar dados para pedidos por localização
const processOrdersByLocation = (orders: any[]): OrderByLocation[] => {
  // Objeto para armazenar contagem por bairro
  const bairroCounts: Record<string, number> = {}
  
  orders.forEach(order => {
    if (!order.delivery?.address) return
    
    // Usar a função otimizada para extrair bairro
    const bairro = extractDistrictFromAddress(order.delivery.address);
    
    // Incrementa a contagem para este bairro
    bairroCounts[bairro] = (bairroCounts[bairro] || 0) + 1;
  })
  
  // Converter para o formato necessário para o gráfico
  // E ordenar por número de pedidos (decrescente)
  return Object.entries(bairroCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    // Limitando para os 5 principais bairros para melhor visualização
    .slice(0, 5);
}

export default function AdminDashboard() {
  // Estado para armazenar o período selecionado
  const [timeRange, setTimeRange] = useState("month")
  
  // Estado para filtros avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [productFilter, setProductFilter] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<[number, number]>([10, 22]) // Horas entre 10h e 22h
  const [minOrderValue, setMinOrderValue] = useState<number>(0)
  
  // Estado para aba atual (para carregamento sob demanda)
  const [activeTab, setActiveTab] = useState("orders")

  // Estados para armazenar produtos disponíveis para filtro
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  
  // Implementação de cache local para dados do Firestore
  const [cachedOrders, setCachedOrders] = useState<Record<string, any[]>>({})
  const [cacheTTL, setCacheTTL] = useState<Record<string, number>>({})

  // Estado para controlar se os dados foram carregados
  const [isLoading, setIsLoading] = useState(true)

  // Estado para armazenar contagem de todos os pedidos por cliente
  const [allCustomerOrderCounts, setAllCustomerOrderCounts] = useState<Record<string, number>>({})
  
  // Estados para armazenar os dados brutos
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [compareOrders, setCompareOrders] = useState<any[]>([])
  
  // Estado para métricas calculadas
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageOrderValue: "0.00",
    orderGrowth: "0.0",
    revenueGrowth: "0.0",
    averageOrdersPerCustomer: 0,
    totalDeliveryFee: 0
  })
  
  // Dados processados com useMemo para evitar reprocessamento desnecessário
  const orderData = useMemo(() => processOrdersByMonth(rawOrders), [rawOrders])
  const compareOrderData = useMemo(() => processOrdersByMonth(compareOrders), [compareOrders])
  const customerData = useMemo(() => processCustomerData(rawOrders, allCustomerOrderCounts), [rawOrders, allCustomerOrderCounts])
  const popularDishes = useMemo(() => processPopularDishes(rawOrders), [rawOrders])
  const ordersByTime = useMemo(() => {
    const processed = processOrdersByTime(rawOrders)
    const compareProcessed = processOrdersByTime(compareOrders)
    
    // Combinar dados para comparação
    return processed.map((item, index) => ({
      ...item,
      compareOrders: compareProcessed[index]?.orders || 0
    }))
  }, [rawOrders, compareOrders])
  
  const ordersByLocation = useMemo(() => processOrdersByLocation(rawOrders), [rawOrders])
  const weeklyOrders = useMemo(() => {
    const processed = processWeeklyOrders(rawOrders)
    const compareProcessed = processWeeklyOrders(compareOrders)
    
    // Combinar dados para comparação
    return processed.map((item, index) => ({
      ...item,
      compareOrders: compareProcessed[index]?.orders || 0
    }))
  }, [rawOrders, compareOrders])
  
  const deliveryTimes = useMemo(() => processDeliveryTimes(rawOrders), [rawOrders])
  const recentOrders = useMemo(() => processRecentOrders(rawOrders), [rawOrders])
  
  // Função para buscar e contar todos os pedidos por cliente
  const fetchAllCustomerOrders = async () => {
    try {
      const ordersRef = collection(db, "orders");
      // O Firestore não suporta operador != em múltiplos campos, então voltamos para filtrar no cliente
      const q = query(ordersRef);
      
      const snapshot = await getDocs(q);
      const customerCounts: Record<string, number> = {};
      const productList = new Set<string>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || '';
        
        // Extrair produtos para filtros
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            if (item.name) productList.add(item.name);
          });
        }
        
        // Considerar apenas pedidos que não foram cancelados
        if (data.status !== 'cancelled') {
          // Para usuários autenticados, usar userId
          if (userId) {
            customerCounts[userId] = (customerCounts[userId] || 0) + 1;
          } else {
            // Para usuários não autenticados, usar email ou telefone como identificador
            const customerId = data.user?.email || data.user?.phone || `guest_${doc.id}`;
            customerCounts[customerId] = (customerCounts[customerId] || 0) + 1;
          }
        }
      });
      
      console.log('👥 Dados de clientes carregados:', {
        totalCustomers: Object.keys(customerCounts).length,
        totalProducts: productList.size
      });
      
      setAllCustomerOrderCounts(customerCounts);
      setAvailableProducts(Array.from(productList));
      
    } catch (error) {
      console.error("Erro ao carregar dados históricos de clientes:", error);
    }
  };

  // Função modificada para aplicar filtros avançados
  const applyAdvancedFilters = (orders: any[]) => {
    return orders.filter(order => {
      // Filtrar por produtos
      if (productFilter.length > 0) {
        const hasSelectedProduct = order.items?.some((item: any) => 
          productFilter.includes(item.name)
        );
        if (!hasSelectedProduct) return false;
      }
      
      // Filtrar por horário
      const orderHour = order.createdAt.getHours();
      if (orderHour < timeFilter[0] || orderHour > timeFilter[1]) return false;
      
      // Filtrar por valor mínimo
      if (order.payment?.total < minOrderValue) return false;
      
      return true;
    });
  };

  // Função auxiliar para resetar dados em caso de erro
  const resetAllData = useCallback(() => {
    setRawOrders([]);
    setCompareOrders([]);
          setMetrics({
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageOrderValue: "0.00",
        orderGrowth: "0.0",
        revenueGrowth: "0.0",
        averageOrdersPerCustomer: 0,
        totalDeliveryFee: 0
      });
  }, []);

  // Função otimizada para carregar dados com cache
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Variáveis para cache
      const cacheKey = `orders_${timeRange}`;
      const cacheTimestamp = new Date().getTime();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutos
      
      // Verificar se há dados em cache válidos (desabilitar cache para filtros avançados)
      if (cachedOrders[cacheKey] && cacheTTL[cacheKey] > cacheTimestamp && !showAdvancedFilters) {
        console.log("Usando dados em cache para", cacheKey);
        setRawOrders(cachedOrders[cacheKey]);
        setIsLoading(false);
        return;
      }

      // Carregar dados históricos de clientes apenas uma vez
      if (Object.keys(allCustomerOrderCounts).length === 0) {
        await fetchAllCustomerOrders();
      }
      
      // Determinar datas para o período atual e de comparação
      const currentDate = new Date();
      let currentStartDate = new Date();
      let compareStartDate = new Date();
      let compareEndDate = new Date();
      
      // Configurar datas com base no período selecionado
      switch (timeRange) {
        case "today":
          // Período atual: hoje
          currentStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
          // Período de comparação: ontem
          compareStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1, 0, 0, 0, 0);
          compareEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
          break;
        case "week":
          // Período atual: última semana
          currentStartDate = subDays(currentDate, 7);
          // Período de comparação: semana anterior
          compareStartDate = subDays(currentDate, 14);
          compareEndDate = subDays(currentDate, 7);
          break;
        case "month":
          // Período atual: último mês
          currentStartDate = startOfMonth(currentDate);
          // Período de comparação: mês anterior
          compareStartDate = subMonths(currentDate, 1);
          compareStartDate = startOfMonth(compareStartDate);
          compareEndDate = endOfMonth(compareStartDate);
          break;
        case "quarter":
          // Período atual: último trimestre
          currentStartDate = startOfQuarter(currentDate);
          // Período de comparação: trimestre anterior
          compareStartDate = subMonths(currentDate, 3);
          compareStartDate = startOfQuarter(compareStartDate);
          compareEndDate = endOfQuarter(compareStartDate);
          break;
        case "year":
          // Período atual: último ano
          currentStartDate = startOfYear(currentDate);
          // Período de comparação: ano anterior
          compareStartDate = subYears(currentDate, 1);
          compareStartDate = startOfYear(compareStartDate);
          compareEndDate = endOfYear(compareStartDate);
          break;
      }
      
      // Buscar todos os pedidos para poder filtrar por período
      console.log("Buscando todos os pedidos...");
      const allOrders = await fetchOrders("all") || [];
      console.log(`Total de pedidos encontrados: ${allOrders.length}`);
      
      // Filtrar por período atual
      const currentOrders = allOrders.filter(order => 
        order.createdAt && order.createdAt >= currentStartDate
      );
      
      // Filtrar por período de comparação
      const comparisonOrders = allOrders.filter(order => 
        order.createdAt && 
        order.createdAt >= compareStartDate && 
        order.createdAt <= compareEndDate
      );
      
      console.log(`Pedidos no período atual (${timeRange}): ${currentOrders.length}`);
      console.log(`Pedidos no período anterior: ${comparisonOrders.length}`);
      
      // Aplicar filtros avançados aos pedidos do período atual
      const filteredCurrentOrders = showAdvancedFilters 
        ? applyAdvancedFilters(currentOrders) 
        : currentOrders;
        

        
      // Calcular métricas diretamente para exibição
      const totalOrders = filteredCurrentOrders.length;
      const totalRevenue = filteredCurrentOrders.reduce((sum, order) => 
        sum + Number(order.payment?.total || 0), 0);
      const totalSubtotal = filteredCurrentOrders.reduce((sum, order) => 
        sum + Number(order.payment?.subtotal || 0), 0);
      const totalDeliveryFee = filteredCurrentOrders.reduce((sum, order) => 
        sum + Number(order.payment?.deliveryFee || 0), 0);
        
      const compareTotalOrders = comparisonOrders.length;
      const compareTotalRevenue = comparisonOrders.reduce((sum, order) => 
        sum + Number(order.payment?.total || 0), 0);
      const compareTotalSubtotal = comparisonOrders.reduce((sum, order) => 
        sum + Number(order.payment?.subtotal || 0), 0);
      const compareTotalDeliveryFee = comparisonOrders.reduce((sum, order) => 
        sum + Number(order.payment?.deliveryFee || 0), 0);
        
      // Calcular crescimento com base nos períodos
      const orderGrowth = calculateGrowth(totalOrders, compareTotalOrders);
      const revenueGrowth = calculateGrowth(totalRevenue, compareTotalRevenue);
        
      // Processar os dados do cliente para as métricas
      const customerDataProcessed = processCustomerData(filteredCurrentOrders, allCustomerOrderCounts);
      const totalCustomers = customerDataProcessed.reduce((sum, item) => sum + item.value, 0);
      

      

        
      // Calcular a média de pedidos por cliente
      let averageOrdersPerCustomer = 0;
      if (Object.keys(allCustomerOrderCounts).length > 0) {
        const totalCustomerCount = Object.keys(allCustomerOrderCounts).length;
        const totalOrdersCount = Object.values(allCustomerOrderCounts).reduce((sum, count) => sum + count, 0);
        averageOrdersPerCustomer = totalOrdersCount / totalCustomerCount;
      }
        
      // Atualizar métricas calculadas
      const newMetrics = {
        totalOrders,
        totalRevenue,
        totalCustomers,
        averageOrderValue: totalOrders > 0 
          ? (totalSubtotal / totalOrders).toFixed(2) 
          : "0.00",
        orderGrowth,
        revenueGrowth,
        averageOrdersPerCustomer,
        totalDeliveryFee
      };
      

      
      setMetrics(newMetrics);
        
      // Atualizar estados com dados brutos - os useMemo cuidarão do processamento
      setRawOrders(filteredCurrentOrders);
      setCompareOrders(comparisonOrders);
      

        
      // Atualizar cache
      setCachedOrders({
        ...cachedOrders,
        [cacheKey]: filteredCurrentOrders
      });
      setCacheTTL({
        ...cacheTTL,
        [cacheKey]: cacheTimestamp + cacheExpiry
      });
        
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      resetAllData();
      setIsLoading(false);
    }
  }, [timeRange, showAdvancedFilters, productFilter, timeFilter, minOrderValue, allCustomerOrderCounts]);

  // Efeito para carregar dados principais
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Efeito para carregar dados específicos da aba selecionada
  useEffect(() => {
    // Evitar carregamentos desnecessários se os dados já foram carregados
    if (rawOrders.length === 0) return;
    
    const loadTabSpecificData = async () => {
      // Para cada aba, podemos otimizar carregando apenas os dados necessários
      switch (activeTab) {
        case "products":
          console.log("Carregando dados específicos de produtos");
          // Poderíamos fazer uma consulta específica para produtos aqui
          break;
          
        case "locations":
          console.log("Carregando dados específicos de localização");
          // Poderíamos carregar dados geográficos adicionais aqui
          break;
          
        case "customers":
          console.log("Carregando dados específicos de clientes");
          // Carregar informações detalhadas sobre clientes
          if (Object.keys(allCustomerOrderCounts).length === 0) {
            await fetchAllCustomerOrders();
          }
          break;
          
        default:
          // Para a aba de pedidos, os dados principais já são suficientes
          break;
      }
    };
    
    loadTabSpecificData();
  }, [activeTab, rawOrders.length, allCustomerOrderCounts, fetchAllCustomerOrders]);



  // Função otimizada para renderizar gráficos com useCallback
  const renderChart = useCallback((
    chartType: string, 
    data: any[], 
    renderFn: () => ReactElement
  ): ReactElement => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Carregando dados...</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      console.log(`renderChart: Dados vazios para ${chartType}`);
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Nenhum dado disponível</p>
        </div>
      );
    }

    // Verificar se os dados têm valores significativos
    let hasSignificantData = false;
    
    if (chartType.includes('pie')) {
      hasSignificantData = data.some(item => (item.value || item.orders || 0) > 0);
    } else if (chartType.includes('bar') || chartType.includes('line')) {
      // Para gráficos de barra e linha, verificar se há pelo menos um valor maior ou igual a zero
      hasSignificantData = data.some(item => {
        const values = Object.values(item).filter(val => typeof val === 'number');
        const hasPositiveValues = values.some(val => val >= 0);
        return hasPositiveValues;
      });
      
      // Para gráficos de horário, ser mais tolerante - mostrar mesmo se só um horário tem dados
      if (chartType.includes('time') || data[0]?.time) {
        const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0);
        hasSignificantData = totalOrders >= 0;
      }
      
      // Para gráficos de linha (mensal), ser mais tolerante - mostrar mesmo com valores baixos
      if (chartType.includes('line')) {
        const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0);
        hasSignificantData = totalOrders >= 0;
      }
    }

    if (!hasSignificantData) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-neutral-500">Dados insuficientes para visualização</p>
        </div>
      );
    }

    // Verificar se os dados possuem campos de comparação
    const hasComparisonData = data.some(item => {
      return typeof item.compareOrders === 'number' && item.compareOrders > 0;
    });

    return renderFn();
  }, [isLoading]);

  return (
    <div className="space-y-6">
      {/* Seletor de período e filtros avançados */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-light">Visão Geral</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {/* Filtro principal de período */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] rounded-none">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="year">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtros avançados */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                Filtros avançados
                {showAdvancedFilters && <Badge className="ml-2 bg-primary text-xs">Ativos</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Configurar filtros</h4>
                
                <div className="space-y-2">
                  <Label>Produtos</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                    {availableProducts.map(product => (
                      <div key={product} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`product-${product}`} 
                          checked={productFilter.includes(product)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProductFilter(prev => [...prev, product]);
                            } else {
                              setProductFilter(prev => prev.filter(p => p !== product));
                            }
                          }}
                        />
                        <Label htmlFor={`product-${product}`}>{product}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Horário dos pedidos: {timeFilter[0]}h às {timeFilter[1]}h</Label>
                  <Slider 
                    value={timeFilter} 
                    min={0} 
                    max={23} 
                    step={1}
                    onValueChange={(value) => setTimeFilter(value as [number, number])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valor mínimo do pedido: R$ {minOrderValue}</Label>
                  <Slider 
                    value={[minOrderValue]} 
                    min={0} 
                    max={200} 
                    step={10}
                    onValueChange={(value) => setMinOrderValue(value[0])}
                  />
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setProductFilter([]);
                      setTimeFilter([10, 22]);
                      setMinOrderValue(0);
                      setShowAdvancedFilters(false);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      const hasFilters = productFilter.length > 0 || timeFilter[0] !== 10 || timeFilter[1] !== 22 || minOrderValue > 0;
                      setShowAdvancedFilters(hasFilters);
                    }}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Botão de exportação */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-4">
                <h4 className="font-medium">Exportar dados para Excel</h4>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(orderData, 'pedidos_por_mes')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Pedidos por Mês
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(weeklyOrders, 'pedidos_por_dia')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Pedidos por Dia da Semana
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(ordersByTime, 'pedidos_por_horario')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Pedidos por Horário
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(popularDishes, 'produtos_populares')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Produtos Populares
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(ordersByLocation, 'pedidos_por_regiao')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Pedidos por Região
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => exportToExcel(recentOrders, 'pedidos_recentes')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Pedidos Recentes
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Indicador de filtros ativos */}
      {showAdvancedFilters && (
        <div className="col-span-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros ativos:</span>
            {productFilter.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {productFilter.length} produto(s)
              </Badge>
            )}
            {timeFilter[0] !== 10 || timeFilter[1] !== 22 ? (
              <Badge variant="outline" className="text-xs">
                {timeFilter[0]}h-{timeFilter[1]}h
              </Badge>
            ) : null}
            {minOrderValue > 0 && (
              <Badge variant="outline" className="text-xs">
                Min: R$ {minOrderValue}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card de Total de Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : metrics.totalOrders.toLocaleString()}</div>
            <div className="flex items-center pt-1 text-xs">
              {!isLoading && (
                <span className={Number(metrics.orderGrowth) > 0 ? "text-green-500 flex items-center" : "text-red-500 flex items-center"}>
                  {Number(metrics.orderGrowth) > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {metrics.orderGrowth}% em relação ao período anterior
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Receita Total (sem taxa de entrega) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `R$ ${(metrics.totalRevenue - metrics.totalDeliveryFee).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
            <div className="flex items-center pt-1 text-xs">
              {!isLoading && (
                <span className={Number(metrics.revenueGrowth) > 0 ? "text-green-500 flex items-center" : "text-red-500 flex items-center"}>
                  {Number(metrics.revenueGrowth) > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {metrics.revenueGrowth}% em relação ao período anterior
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Taxa de Entrega */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <Truck className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : `R$ ${metrics.totalDeliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
            <div className="text-xs text-neutral-500 pt-1">
              {!isLoading && `Total arrecadado em taxas de entrega`}
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
            <div className="text-2xl font-bold">{isLoading ? "..." : metrics.totalCustomers.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{isLoading ? "..." : `R$ ${Number(metrics.averageOrderValue).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</div>
            <div className="text-xs text-neutral-500 pt-1">
              {!isLoading && `Baseado em ${metrics.totalOrders.toLocaleString()} pedidos`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="orders" className="w-full" onValueChange={(value) => setActiveTab(value)}>
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
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pedidos por Mês */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Pedidos por Mês</CardTitle>
                <CardDescription>Número total de pedidos por mês</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart("line", orderData, () => (
                      <LineChart data={orderData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis 
                          domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${value} pedidos`, 
                            name === "orders" ? "Total de Pedidos" : name
                          ]}
                          labelFormatter={(label) => `Mês: ${label}`}
                          contentStyle={{ borderRadius: '8px' }}
                        />
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
                        
                        {/* Adiciona linha de comparação se estiver comparando */}
                        {compareOrderData.length > 0 && (
                          <Line
                            type="monotone"
                            data={compareOrderData}
                            dataKey="orders"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            activeDot={{ r: 6 }}
                            dot={{ r: 3 }}
                            name="Período anterior"
                          />
                        )}
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
                          domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${value} pedidos`, 
                            name === "orders" ? "Período atual" : "Período anterior"
                          ]} 
                        />
                        <Legend />
                        <Bar dataKey="orders" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30} name="Período atual" />
                        {compareOrderData.length > 0 && (
                          <Bar 
                            dataKey="compareOrders"
                            fill="#82ca9d" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30} 
                            name="Período anterior" 
                          />
                        )}
                      </BarChart>
                    ))}
                  </ResponsiveContainer>
                </div>
                {/* Área de informações secundárias removida */}
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
                          domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]} 
                          allowDecimals={false}
                          tickFormatter={(value) => Math.round(value).toString()}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${value} pedidos`, 
                            name === "orders" ? "Atual" : "Período anterior"
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="orders" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={30} name="Pedidos" />
                        {compareOrderData.length > 0 && (
                          <Bar 
                            dataKey="compareOrders"
                            fill="#8884d8" 
                            radius={[4, 4, 0, 0]} 
                            barSize={30} 
                            name="Pedidos (período anterior)" 
                            opacity={0.7}
                          />
                        )}
                      </BarChart>
                    ))}
                  </ResponsiveContainer>
                </div>
                {/* Área de informações secundárias removida */}
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
                          domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]} 
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
                {/* Área de informações secundárias removida */}
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
                    <div className="text-4xl font-bold text-primary">
                      {isLoading ? "..." : metrics.averageOrdersPerCustomer.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-500 mt-2">Pedidos por cliente (média geral)</div>
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
                {(!ordersByLocation || !Array.isArray(ordersByLocation) || ordersByLocation.length === 0) ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-neutral-500">Nenhum dado disponível para exibir o gráfico.</p>
                  </div>
                ) : (
                  <Suspense fallback={<div className="flex h-[300px] items-center justify-center"><p>Carregando mapa...</p></div>}>
                    <LazyChart type="pie" data={ordersByLocation}>
                      <Pie
                        data={ordersByLocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {ordersByLocation.map((entry: OrderByLocation, index: number) => (
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
                    </LazyChart>
                  </Suspense>
                )}
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
                          domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.1))]} 
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

