"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Plus, Minus, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/context/cart-context"
import { motion } from "framer-motion"
import { useRef } from "react"
import { formatCurrency } from "@/lib/utils"
import { useMenu } from "@/contexts/menu-context"
import DatePeriodSelector from "@/components/date-period-selector"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Itens recomendados para o carrossel
const recommendedItems = [
  {
    id: "rec1",
    name: "Carpaccio de Wagyu",
    description: "Finas fatias de wagyu, rúcula selvagem, lascas de parmesão e azeite trufado",
    price: 58,
    image: "/placeholder.svg?height=600&width=600",
  },
  {
    id: "rec2",
    name: "Burrata com Tomates",
    description: "Burrata cremosa, tomates confitados, pesto de manjericão",
    price: 52,
    image: "/placeholder.svg?height=600&width=600",
  },
  {
    id: "rec3",
    name: "Risoto de Funghi",
    description: "Arroz arbóreo, mix de cogumelos frescos, manteiga e parmesão",
    price: 68,
    image: "/placeholder.svg?height=600&width=600",
  },
  {
    id: "rec4",
    name: "Tiramisù",
    description: "Clássico italiano com camadas de biscoito champagne, café e mascarpone",
    price: 32,
    image: "/placeholder.svg?height=600&width=600",
  },
  {
    id: "rec5",
    name: "Vinho Tinto Barolo",
    description: "Barolo DOCG, Piemonte, Itália - Taça 150ml",
    price: 45,
    image: "/placeholder.svg?height=600&width=600",
  },
]

export default function CartPage() {
  const { cart, updateItemQuantity, removeItem, clearCart, addItem } = useCart()
  const [couponCode, setCouponCode] = useState("")
  const carouselRef = useRef<HTMLDivElement>(null)
  const { selectedDate, selectedPeriod } = useMenu()
  const router = useRouter()

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const deliveryFee = 5.0
  const total = subtotal + deliveryFee

  const handleFinishOrder = () => {
    if (!selectedDate || !selectedPeriod) {
      toast({
        title: "Selecione a data e período",
        description: "Por favor, selecione a data e período de entrega antes de continuar.",
        variant: "destructive",
      })
      return
    }
    router.push("/checkout")
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return

    const scrollAmount = 300
    const currentScroll = carouselRef.current.scrollLeft

    carouselRef.current.scrollTo({
      left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: "smooth",
    })
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-6 py-24 sm:py-32 text-center max-w-2xl">
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8">
          <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-neutral-200 -mx-8 -mt-8 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light mb-2">Seu Carrinho</h1>
            <p className="text-neutral-600">Seu carrinho está vazio.</p>
          </div>

          <Link href="/cardapio">
            <Button className="rounded-none bg-primary text-white hover:bg-primary/90 text-xs sm:text-sm">
              Explorar Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-24 max-w-7xl pt-28">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-light tracking-tight">Seu Carrinho</h1>
        <div className="w-20 h-[1px] bg-primary mx-auto mt-6"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Itens Selecionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
                <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-neutral-200">
                  <h2 className="text-xl font-medium flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" /> Itens do Carrinho
                  </h2>
                </div>

                {/* Versão para desktop */}
                <div className="hidden md:block p-6">
                  <table className="w-full">
                    <thead className="border-b border-neutral-200">
                      <tr>
                        <th className="text-left p-4 sm:p-6 font-normal text-neutral-500 text-sm">Item</th>
                        <th className="text-center p-4 sm:p-6 font-normal text-neutral-500 text-sm">Quantidade</th>
                        <th className="text-right p-4 sm:p-6 font-normal text-neutral-500 text-sm">Preço</th>
                        <th className="p-4 sm:p-6 w-12 sm:w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id} className="border-b border-neutral-200">
                          <td className="p-4 sm:p-6">
                            <div className="font-light text-sm sm:text-base">{item.name}</div>
                            {item.options && (
                              <div className="text-xs sm:text-sm text-neutral-500 mt-1">
                                {Object.entries(item.options).map(([key, value]) => (
                                  <div key={key}>
                                    {key}: {value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 sm:p-6">
                            <div className="flex justify-center">
                              <div className="flex items-center border border-neutral-200">
                                <button
                                  className="px-2 sm:px-3 py-1 text-base sm:text-lg"
                                  onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                >
                                  -
                                </button>
                                <span className="px-2 sm:px-3 py-1 text-sm">{item.quantity}</span>
                                <button
                                  className="px-2 sm:px-3 py-1 text-base sm:text-lg"
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 sm:p-6 text-right font-light text-sm sm:text-base">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                          <td className="p-4 sm:p-6">
                            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Versão para mobile */}
                <div className="md:hidden p-6 space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="border border-neutral-200 p-3 sm:p-4 rounded-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm sm:text-base">{item.name}</h3>
                          <p className="text-neutral-500 text-xs mt-0.5">{formatCurrency(item.price)} cada</p>
                          {item.options && (
                            <div className="text-xs text-neutral-500 mt-1">
                              {Object.entries(item.options).map(([key, value]) => (
                                <div key={key}>
                                  {key}: {value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-500" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center border border-neutral-200 rounded-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                          <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                        <div className="font-medium text-sm">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 pt-0 flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={clearCart}
                    className="rounded-none border-black text-black hover:bg-black hover:text-white text-xs sm:text-sm"
                  >
                    Limpar Carrinho
                  </Button>
                  <Link href="/cardapio">
                    <Button
                      variant="outline"
                      className="rounded-none border-black text-black hover:bg-black hover:text-white w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Continuar Comprando
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Data e Período</CardTitle>
            </CardHeader>
            <CardContent>
              <DatePeriodSelector />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de Entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-primary text-white hover:bg-primary/90"
                onClick={handleFinishOrder}
                disabled={cart.length === 0 || !selectedDate || !selectedPeriod}
              >
                Finalizar Agendamento
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Carrossel de itens recomendados */}
      <div className="mt-16 sm:mt-24 mb-8 sm:mb-12">
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
          <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium">Adicione mais itens</h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-none border-black h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-none border-black h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto scrollbar-hide gap-4 sm:gap-6 pb-4 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recommendedItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="min-w-[200px] sm:min-w-[280px] max-w-[200px] sm:max-w-[280px] flex-shrink-0 group"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="border border-neutral-200 overflow-hidden">
                    <div className="relative h-32 sm:h-48 w-full">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-medium text-sm sm:text-base">{item.name}</h3>
                      <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex justify-between items-center mt-3 sm:mt-4">
                        <span className="font-light text-xs sm:text-sm">{formatCurrency(item.price)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-none border-black text-black hover:bg-primary hover:text-white hover:border-primary text-xs h-7 px-2"
                          onClick={() =>
                            addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              quantity: 1,
                            })
                          }
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

