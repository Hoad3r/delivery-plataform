"use client"

import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Check, ShoppingCart, Star, Heart, Plus, Minus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useMenu } from "@/contexts/menu-context"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const categories = [
  { id: "tradicional", name: "Tradicionais" },
  { id: "fitness", name: "Fitness" },
  { id: "vegetariana", name: "Vegetarianas" },
  { id: "lowcarb", name: "Low Carb" },
]

export default function MenuItems() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("categoria")
  const searchTerm = searchParams.get("busca")?.toLowerCase() || ""
  const { addItem, cart, removeItem } = useCart()
  const containerRef = useRef(null)
  const { dishes, selectedDate, selectedPeriod, getDishAvailability } = useMenu()
  const [displayedItems, setDisplayedItems] = useState(dishes)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Atualiza os itens exibidos quando a categoria ou busca mudam
  useEffect(() => {
    let filtered = dishes

    // Aplica filtro de categoria se existir e não estiver em mobile
    if (!isMobile && categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Aplica filtro de busca se existir
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm)
      )
    }

    setDisplayedItems(filtered)
  }, [categoryFilter, searchTerm, dishes, isMobile])

  const isItemInCart = (itemId: string) => {
    const found = cart.some(item => item.id === itemId)
    return found
  }

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    })
  }

  const handleRemoveFromCart = (itemId: string) => {
    removeItem(itemId)
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "fitness":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Star className="w-3 h-3 mr-1" />
            Fitness
          </Badge>
        )
      case "lowcarb":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Star className="w-3 h-3 mr-1" />
            Low Carb
          </Badge>
        )
      case "vegetariana":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Star className="w-3 h-3 mr-1" />
            Vegetariana
          </Badge>
        )
      default:
        return null
    }
  }

  const renderDishCard = (dish: any, isMobileCard = false) => {
    const availability = getDishAvailability(dish.id)
    const isAvailable = availability && availability.available > 0 && dish.isAvailable
    const isAdded = isItemInCart(dish.id)

    return (
      <motion.div
        key={dish.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        layout
        className={isMobileCard ? "min-w-[360px] w-[360px] snap-start pl-8 first:pl-8" : ""}
      >
        <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-2xl h-full">
          <div className="relative h-64">
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {getCategoryBadge(dish.category)}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{dish.name}</h3>
              <p className="text-sm text-white/90 line-clamp-2 mb-4">{dish.description}</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-bold text-white group-hover:text-[#DB775F] transition-colors duration-300">
                  {formatCurrency(dish.price)}
                </span>
                {!isAdded && isAvailable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white shrink-0"
                    onClick={() => handleAddToCart(dish)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar
                  </Button>
                ) : isAdded ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary whitespace-nowrap"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Adicionado
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                      onClick={() => handleRemoveFromCart(dish.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-12 w-full overflow-x-hidden">
        {/* Resultados de Busca */}
        {searchTerm && (
          <section className="w-full">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-medium text-[#DB775F]">
                Resultados para "{searchTerm}"
              </h2>
              <div className="h-[1px] flex-1 bg-[#DB775F]/10"></div>
            </div>
            <div className="flex overflow-x-auto pb-6 -mx-6 pl-6 pr-8 gap-6 snap-x snap-mandatory scrollbar-hide">
              {displayedItems.map((dish) => renderDishCard(dish, true))}
            </div>
          </section>
        )}

        {/* Seções por Categoria */}
        {!searchTerm && categories.map((category) => {
          const categoryItems = dishes.filter(dish => dish.category === category.id)
          if (categoryItems.length === 0) return null

          return (
            <section key={category.id} className="w-full">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-medium text-[#DB775F] capitalize">
                  {category.name}
                </h2>
                <div className="h-[1px] flex-1 bg-[#DB775F]/10"></div>
              </div>
              <div className="flex overflow-x-auto pb-6 -mx-6 pl-6 pr-8 gap-6 snap-x snap-mandatory scrollbar-hide">
                {categoryItems.map((dish) => renderDishCard(dish, true))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
      <AnimatePresence mode="wait">
        {displayedItems.map((dish) => renderDishCard(dish, false))}
      </AnimatePresence>
    </div>
  )
}

