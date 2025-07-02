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
import React from "react"

const categories = [
  { id: "Fitness", name: "Fitness" },
  { id: "Low Carb", name: "Low Carb" },
  { id: "vegetariana", name: "Vegetariana" },
  { id: "tradicional", name: "Tradicional" },
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

    // LOG: pratos disponíveis antes do filtro
    console.log('Dishes disponíveis:', dishes)
    console.log('Filtro de categoria:', categoryFilter)
    console.log('Filtro de busca:', searchTerm)

    // Aplica filtro de categoria se existir e não estiver em mobile
    if (!isMobile && categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((item) => {
        // Normaliza para comparar sem case sensitive e sem espaços extras
        const categoriesArr: string[] = Array.isArray((item as any).categories) ? (item as any).categories : []
        const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()
        const filterCategory = normalize(categoryFilter)
        const match = categoriesArr.some((cat: string) => normalize(cat) === filterCategory)
        console.log(`Comparando categorias do prato '${item.name}':`, categoriesArr, 'com', filterCategory, '?', match)
        return match
      })
    }

    // Aplica filtro de busca se existir
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          (Array.isArray((item as any).categories) && (item as any).categories.some((cat: string) => cat.toLowerCase().includes(searchTerm)))
      )
    }

    // LOG: pratos após filtro
    console.log('Dishes após filtro:', filtered)

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
      case "Low Carb":
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
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={isMobileCard ? "min-w-[280px] w-[280px] snap-start pl-4 first:pl-4" : "h-full"}
      >
        <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-2xl h-full">
          <div className="relative h-72">
            <Image
              src={dish.image && dish.image !== "" ? dish.image : "/placeholder-logo.png"}
              alt={dish.name}
              fill
              placeholder={dish.image && dish.image.startsWith('/') ? 'blur' : 'empty'}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-2">
              {Array.isArray((dish as any).categories) && (dish as any).categories.length <= 2
                ? (dish as any).categories.map((cat: string) => (
                    <React.Fragment key={cat}>{getCategoryBadge(cat)}</React.Fragment>
                  ))
                : (
                    <div className="flex flex-row gap-1">
                      {(dish as any).categories.map((cat: string) => getCategoryStar(cat))}
                    </div>
                  )
              }
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-bold text-white mb-1">{dish.name}</h3>
              <p className="text-xs text-white/90 line-clamp-2 mb-2">{dish.description}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-white group-hover:text-[#DB775F] transition-colors duration-300">
                  {formatCurrency(dish.price)}
                </span>
                {!isAdded && isAvailable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 bg-white/10 hover:bg-white/20 border-white/20 text-white hover:text-white shrink-0 text-xs"
                    onClick={() => handleAddToCart(dish)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                ) : isAdded ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 px-3 !bg-[#DB775F]/20 hover:!bg-[#DB775F]/30 !text-white hover:!text-white whitespace-nowrap text-xs"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Adicionado
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500"
                      onClick={() => handleRemoveFromCart(dish.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
            <div className="flex overflow-x-auto pb-6 -mx-4 pl-4 pr-4 gap-4 snap-x snap-mandatory scrollbar-hide">
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
              <div className="flex overflow-x-auto pb-6 -mx-4 pl-4 pr-4 gap-4 snap-x snap-mandatory scrollbar-hide">
                {categoryItems.map((dish) => renderDishCard(dish, true))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
      {displayedItems.length > 0 ? (
        <>
          {displayedItems.map((dish) => renderDishCard(dish, false))}
          {/* Seção extra quando houver 2 ou 3 cards */}
          {(displayedItems.length === 2 || displayedItems.length === 3) && (
            <div className="col-span-1 sm:col-span-2 xl:col-span-3 h-[400px]"></div>
          )}
        </>
      ) : null}
    </div>
  )
}

