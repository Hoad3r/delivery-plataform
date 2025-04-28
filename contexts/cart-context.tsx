"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  options?: Record<string, string>
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error("Error loading cart:", error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (cart.length === 0) {
        localStorage.removeItem("cart")
        console.log("Carrinho vazio, removendo do localStorage")
      } else {
        localStorage.setItem("cart", JSON.stringify(cart))
        console.log("Carrinho salvo no localStorage:", cart)
      }
    } catch (error) {
      console.error("Erro ao salvar carrinho:", error)
    }
  }, [cart])

  const addToCart = (item: CartItem) => {
    console.log("addToCart called with item:", item)
    setCart((prevCart) => {
      console.log("Previous cart state:", prevCart)
      const newCart = [...prevCart]
      const existingItemIndex = newCart.findIndex((i) => i.id === item.id)
      console.log("Existing item index:", existingItemIndex)

      if (existingItemIndex >= 0) {
        // Item já existe, incrementa a quantidade
        console.log("Updating existing item quantity")
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1
        }
      } else {
        // Item não existe, adiciona com quantidade 1
        console.log("Adding new item")
        newCart.push({
          ...item,
          quantity: 1
        })
      }

      console.log("New cart state:", newCart)
      return newCart
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    console.log("Limpando o carrinho...")
    setCart([])
    try {
      localStorage.removeItem("cart")
      console.log("Carrinho limpo com sucesso")
    } catch (error) {
      console.error("Erro ao limpar o carrinho:", error)
    }
  }

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
} 