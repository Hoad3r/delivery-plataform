"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Order } from "@/lib/mock-data"
import { Dish } from "@/types/menu"
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase" // Assumindo que você tem um arquivo de configuração do Firebase em lib/firebase.ts ou .js

interface MenuContextType {
  dishes: Dish[]
  orders: Order[]
  getDishAvailability: (dishId: string) => {
    available: number
    sold: number
    maxQuantity: number
    deliveryTime: {
      start: string
      end: string
    }
  }
  createOrder: (items: { dishId: string; quantity: number; period: "morning" | "afternoon" }[], deliveryType: "delivery" | "pickup") => Order | null
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "dishes"), (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedDishes: Dish[] = []
      snapshot.forEach((doc) => {
        const dishData = doc.data()
        // Só inclui pratos que estão disponíveis E têm quantidade > 0
        const isAvailable = dishData.isAvailable === true || dishData.isAvailable === undefined
        const hasQuantity = (dishData.availableQuantity || 0) > 0
        
        if (isAvailable && hasQuantity) {
          fetchedDishes.push({ id: doc.id, ...dishData } as Dish)
        }
      })
              setDishes(fetchedDishes)
    })

    return () => unsubscribe()
  }, [])

  const getDishAvailability = (dishId: string) => {
    const dish = dishes.find(d => d.id === dishId)
    if (!dish) {
      return {
        available: 0,
        sold: 0,
        maxQuantity: 0,
        deliveryTime: { start: "00:00", end: "23:59" }
      }
    }
    
    return {
      available: dish.availableQuantity || 0,
      sold: 0,
      maxQuantity: dish.availableQuantity || 0,
      deliveryTime: { start: "00:00", end: "23:59" }
    }
  }

  const createOrder = (
    items: { dishId: string; quantity: number; period: "morning" | "afternoon" }[],
    deliveryType: "delivery" | "pickup"
  ): Order | null => {
    // Calcular valor total
    const totalAmount = items.reduce((total, item) => {
      const dish = dishes.find((d) => d.id === item.dishId)
      return total + (dish?.price || 0) * item.quantity
    }, 0)

    // Criar novo pedido
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      userId: "user1", // Temporário, deve vir do contexto de autenticação
      items: items,
      deliveryDate: new Date().toISOString().split("T")[0],
      deliveryPeriod: "morning",
      deliveryType,
      status: "pending",
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setOrders([...orders, newOrder])
    return newOrder
  }

  return (
    <MenuContext.Provider
      value={{
        dishes,
        orders,
        getDishAvailability,
        createOrder,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider")
  }
  return context
} 
