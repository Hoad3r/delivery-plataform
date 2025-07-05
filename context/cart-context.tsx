"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  options?: Record<string, string>
}

type CartContextType = {
  cart: CartItem[]
  addItem: (item: CartItem) => Promise<boolean>
  updateItemQuantity: (id: string, quantity: number) => Promise<boolean>
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addItem = async (newItem: CartItem): Promise<boolean> => {
    try {
      // Verificar disponibilidade de estoque
      const dishesRef = collection(db, "dishes");
      const q = query(dishesRef, where("id", "==", newItem.id));
      const dishSnapshot = await getDocs(q);
      
      if (dishSnapshot.empty) {
        console.error("Produto não encontrado:", newItem.name);
        return false;
      }
      
      const dishData = dishSnapshot.docs[0].data();
      const availableStock = dishData.availableQuantity || 0;
      const isAvailable = dishData.isAvailable !== false;
      
      if (!isAvailable || availableStock === 0) {
        console.error("Produto indisponível:", newItem.name);
        return false;
      }
      
      // Verificar se há estoque suficiente para a quantidade solicitada
      const currentCartQuantity = cart.find(item => item.id === newItem.id)?.quantity || 0;
      const totalRequestedQuantity = currentCartQuantity + newItem.quantity;
      
      if (totalRequestedQuantity > availableStock) {
        console.error("Estoque insuficiente:", newItem.name, "Disponível:", availableStock, "Solicitado:", totalRequestedQuantity);
        return false;
      }
      
      // Se passou por todas as validações, adicionar ao carrinho
      setCart((prevCart) => {
        // Check if item already exists in cart
        const existingItemIndex = prevCart.findIndex(
          (item) => item.id === newItem.id && JSON.stringify(item.options) === JSON.stringify(newItem.options),
        )

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          const updatedCart = [...prevCart]
          updatedCart[existingItemIndex].quantity += newItem.quantity
          return updatedCart
        } else {
          // Add new item if it doesn't exist
          return [...prevCart, newItem]
        }
      })
      
      return true;
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      return false;
    }
  }

  const updateItemQuantity = async (id: string, quantity: number): Promise<boolean> => {
    try {
      // Verificar disponibilidade de estoque para a nova quantidade
      const dishesRef = collection(db, "dishes");
      const q = query(dishesRef, where("id", "==", id));
      const dishSnapshot = await getDocs(q);
      
      if (dishSnapshot.empty) {
        console.error("Produto não encontrado para atualização de quantidade");
        return false;
      }
      
      const dishData = dishSnapshot.docs[0].data();
      const availableStock = dishData.availableQuantity || 0;
      const isAvailable = dishData.isAvailable !== false;
      
      if (!isAvailable || availableStock === 0) {
        console.error("Produto indisponível para atualização de quantidade");
        return false;
      }
      
      if (quantity > availableStock) {
        console.error("Estoque insuficiente para a quantidade solicitada");
        return false;
      }
      
      // Se passou por todas as validações, atualizar a quantidade
      setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity } : item)))
      return true;
    } catch (error) {
      console.error("Erro ao verificar estoque para atualização:", error);
      return false;
    }
  }

  const removeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider value={{ cart, addItem, updateItemQuantity, removeItem, clearCart }}>
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

