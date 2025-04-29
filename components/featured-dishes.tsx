"use client"

import Image from "next/image"
import Link from "next/link"
import { useMenu } from "@/contexts/menu-context"
import { formatCurrency } from "@/lib/utils"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"

export default function FeaturedDishes() {
  const { dishes } = useMenu()
  const { addItem } = useCart()
  const router = useRouter()
  
  // Selecionar 3 pratos para exibir como especialidades
  const featuredDishes = dishes.slice(0, 3)

  const handleDishClick = (dish: any) => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
    })
    router.push('/cardapio')
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
      {featuredDishes.map((dish) => (
        <div
          key={dish.id}
          onClick={() => handleDishClick(dish)}
          className="group cursor-pointer"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={dish.image || "/placeholder.svg"}
                alt={dish.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-1 sm:space-y-2 text-center">
              <h3 className="font-light text-base sm:text-xl">{dish.name}</h3>
              <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2">{dish.description}</p>
              <p className="font-light text-sm sm:text-base">{formatCurrency(dish.price)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

