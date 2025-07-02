export interface NutritionalInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fibras?: number
}

export interface Dish {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isAvailable: boolean
  categories: string[]
  ingredients?: string[]
  preparationTime?: number
  nutritionalInfo?: NutritionalInfo
  options?: {
    id: string
    name: string
    price: number
  }[]
} 
