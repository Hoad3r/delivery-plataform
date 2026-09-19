import { Dish } from "@/types/menu"

export interface Order {
  id: string
  userId: string
  items: {
    dishId: string
    quantity: number
    period: 'morning' | 'afternoon'
  }[]
  deliveryDate: string // formato YYYY-MM-DD
  deliveryPeriod: 'morning' | 'afternoon'
  deliveryType: 'delivery' | 'pickup'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: string
  updatedAt: string
}

// Dados mockados usados na versão demo/portfolio do site,
// substituindo a leitura em tempo real do Firestore.
export const mockDishes: Dish[] = [
  {
    id: "1",
    name: "Marmita Fit de Frango",
    description: "Peito de frango grelhado com arroz integral, feijão e salada",
    price: 25.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["fitness"],
    ingredients: ["Frango", "Arroz Integral", "Feijão", "Salada"],
    preparationTime: 30,
    nutritionalInfo: { calories: 450, protein: 35, carbs: 45, fat: 12 },
  },
  {
    id: "2",
    name: "Marmita Low Carb",
    description: "Filé de frango grelhado, omelete, legumes grelhados e salada verde",
    price: 28.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["Low Carb"],
    ingredients: ["Frango", "Ovos", "Legumes", "Salada"],
    preparationTime: 25,
    nutritionalInfo: { calories: 380, protein: 40, carbs: 15, fat: 18 },
  },
  {
    id: "3",
    name: "Marmita Vegana",
    description: "Arroz integral, lentilha, legumes salteados, tofu grelhado e mix de folhas",
    price: 27.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["vegetariana"],
    ingredients: ["Arroz Integral", "Lentilha", "Tofu", "Legumes", "Folhas"],
    preparationTime: 25,
    nutritionalInfo: { calories: 380, protein: 15, carbs: 55, fat: 10 },
  },
  {
    id: "4",
    name: "Marmita Executiva",
    description: "Arroz, feijão, filé mignon, batata rústica, farofa e salada especial",
    price: 32.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["tradicional"],
    ingredients: ["Arroz", "Feijão", "Filé Mignon", "Batata", "Farofa", "Salada"],
    preparationTime: 35,
    nutritionalInfo: { calories: 550, protein: 30, carbs: 60, fat: 20 },
  },
  {
    id: "5",
    name: "Marmita Fitness Salmão",
    description: "Salmão grelhado, quinoa, brócolis, cenoura e molho de ervas",
    price: 35.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["fitness"],
    ingredients: ["Salmão", "Quinoa", "Brócolis", "Cenoura", "Ervas"],
    preparationTime: 30,
    nutritionalInfo: { calories: 420, protein: 35, carbs: 35, fat: 15 },
  },
  {
    id: "6",
    name: "Marmita Low Carb Carne",
    description: "Carne moída, abobrinha refogada, berinjela grelhada e salada",
    price: 29.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["Low Carb"],
    ingredients: ["Carne Moída", "Abobrinha", "Berinjela", "Salada"],
    preparationTime: 25,
    nutritionalInfo: { calories: 400, protein: 35, carbs: 15, fat: 20 },
  },
  {
    id: "7",
    name: "Marmita Vegetariana Especial",
    description: "Arroz integral, grão de bico, legumes salteados, tofu grelhado e molho de ervas",
    price: 28.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["vegetariana"],
    ingredients: ["Arroz Integral", "Grão de Bico", "Tofu", "Legumes", "Ervas"],
    preparationTime: 25,
    nutritionalInfo: { calories: 390, protein: 18, carbs: 50, fat: 12 },
  },
  {
    id: "8",
    name: "Marmita Tradicional",
    description: "Arroz, feijão, frango desfiado, farofa e salada",
    price: 24.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["tradicional"],
    ingredients: ["Arroz", "Feijão", "Frango", "Farofa", "Salada"],
    preparationTime: 25,
    nutritionalInfo: { calories: 480, protein: 25, carbs: 55, fat: 15 },
  },
  {
    id: "9",
    name: "Marmita Fitness Atum",
    description: "Atum grelhado, arroz integral, legumes no vapor e molho de limão",
    price: 30.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["fitness"],
    ingredients: ["Atum", "Arroz Integral", "Legumes", "Limão"],
    preparationTime: 25,
    nutritionalInfo: { calories: 400, protein: 35, carbs: 35, fat: 12 },
  },
  {
    id: "10",
    name: "Marmita Low Carb Frango",
    description: "Peito de frango grelhado, abobrinha, berinjela e salada verde",
    price: 27.9,
    image: "/placeholder.svg",
    isAvailable: true,
    availableQuantity: 20,
    categories: ["Low Carb"],
    ingredients: ["Frango", "Abobrinha", "Berinjela", "Salada"],
    preparationTime: 25,
    nutritionalInfo: { calories: 380, protein: 35, carbs: 15, fat: 18 },
  },
]

const today = new Date().toISOString().split("T")[0]

export const mockOrders: Order[] = [
  {
    id: "1",
    userId: "user1",
    items: [{ dishId: "1", quantity: 2, period: "morning" }],
    deliveryDate: today,
    deliveryPeriod: "morning",
    deliveryType: "delivery",
    status: "confirmed",
    totalAmount: 51.8,
    createdAt: "2024-04-28T10:00:00Z",
    updatedAt: "2024-04-28T10:00:00Z",
  },
  {
    id: "2",
    userId: "user2",
    items: [{ dishId: "2", quantity: 1, period: "morning" }],
    deliveryDate: today,
    deliveryPeriod: "morning",
    deliveryType: "pickup",
    status: "pending",
    totalAmount: 28.9,
    createdAt: "2024-04-28T11:00:00Z",
    updatedAt: "2024-04-28T11:00:00Z",
  },
]
