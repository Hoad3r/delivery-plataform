export interface Dish {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isAvailable: boolean
  category: string
  options?: {
    id: string
    name: string
    price: number
  }[]
} 