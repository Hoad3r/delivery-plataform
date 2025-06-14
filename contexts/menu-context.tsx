"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Dish, DishAvailability, Order, mockDishes, mockDishAvailability, mockOrders } from "@/lib/mock-data"
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase" // Assumindo que você tem um arquivo de configuração do Firebase em lib/firebase.ts ou .js

interface MenuContextType {
  dishes: Dish[]
  availability: DishAvailability[]
  orders: Order[]
  selectedDate: string
  selectedPeriod: "morning" | "afternoon"
  setSelectedDate: (date: string) => void
  setSelectedPeriod: (period: "morning" | "afternoon") => void
  getDishAvailability: (dishId: string) => {
    available: number
    sold: number
    maxQuantity: number
    deliveryTime: {
      start: string
      end: string
    }
  } | null
  createOrder: (items: { dishId: string; quantity: number }[], deliveryType: "delivery" | "pickup") => Order | null
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [availability, setAvailability] = useState<DishAvailability[]>(mockDishAvailability)
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon">("morning")

  useEffect(() => {
    const fetchDishes = async () => {
      const q = query(collection(db, "dishes"), where("isAvailable", "==", true))
      const querySnapshot = await getDocs(q)
      const fetchedDishes: Dish[] = []
      querySnapshot.forEach((doc) => {
        fetchedDishes.push({ id: doc.id, ...doc.data() } as Dish)
      })
      setDishes(fetchedDishes)
    }

    fetchDishes()
  }, [])

  // Atualizar disponibilidade quando a data ou período mudar
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    if (selectedDate < today) {
      setSelectedDate(today)
    }
  }, [selectedDate])

  const getDishAvailability = (dishId: string) => {
    const dishAvailability = availability.find(
      (a) => a.dishId === dishId && a.date === selectedDate
    )
    
    if (!dishAvailability) {
      // Se não houver disponibilidade para a data selecionada, retornar uma nova sem modificar o estado
      const defaultAvailabilityPeriod = {
        available: 20,
        sold: 0,
        maxQuantity: 20,
        deliveryTime: { start: "11:00", end: "13:00" }
      }
      // Retorna a disponibilidade padrão para o período selecionado
      return selectedPeriod === "morning" ? defaultAvailabilityPeriod : {
        available: 20,
        sold: 0,
        maxQuantity: 20,
        deliveryTime: { start: "14:00", end: "16:00" }
      }
    }

    return dishAvailability.periods[selectedPeriod]
  }

  const createOrder = (
    items: { dishId: string; quantity: number }[],
    deliveryType: "delivery" | "pickup"
  ): Order | null => {
    // Verificar disponibilidade
    for (const item of items) {
      const availability = getDishAvailability(item.dishId)
      if (!availability || availability.available < item.quantity) {
        return null
      }
    }

    // Calcular valor total
    const totalAmount = items.reduce((total, item) => {
      const dish = dishes.find((d) => d.id === item.dishId)
      return total + (dish?.price || 0) * item.quantity
    }, 0)

    // Criar novo pedido
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      userId: "user1", // Temporário, deve vir do contexto de autenticação
      items: items.map((item) => ({
        ...item,
        period: selectedPeriod,
      })),
      deliveryDate: selectedDate,
      deliveryPeriod: selectedPeriod,
      deliveryType,
      status: "pending",
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Atualizar disponibilidade
    const newAvailability = availability.map((a) => {
      if (a.date === selectedDate) {
        const item = items.find((i) => i.dishId === a.dishId)
        if (item) {
          return {
            ...a,
            periods: {
              ...a.periods,
              [selectedPeriod]: {
                ...a.periods[selectedPeriod],
                available: a.periods[selectedPeriod].available - item.quantity,
                sold: a.periods[selectedPeriod].sold + item.quantity,
              },
            },
          }
        }
      }
      return a
    })

    // Atualizar estado
    setOrders([...orders, newOrder])
    // Em um ambiente real, aqui faríamos a chamada para a API

    return newOrder
  }

  return (
    <MenuContext.Provider
      value={{
        dishes,
        availability,
        orders,
        selectedDate,
        selectedPeriod,
        setSelectedDate,
        setSelectedPeriod,
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