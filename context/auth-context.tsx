"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  notifications?: boolean
}

type Address = {
  id: string
  nickname: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
  isDefault?: boolean
}

type PaymentMethod = {
  id: string
  nickname: string
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  type: "credit" | "debit"
  last4: string
  isDefault?: boolean
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: any) => Promise<boolean>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  addresses: Address[]
  addAddress: (address: Omit<Address, "id">) => Promise<boolean>
  updateAddress: (id: string, address: Omit<Address, "id">) => Promise<boolean>
  removeAddress: (id: string) => Promise<boolean>
  paymentMethods: PaymentMethod[]
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, "id" | "last4">) => Promise<boolean>
  updatePaymentMethod: (id: string, paymentMethod: Omit<PaymentMethod, "id" | "last4">) => Promise<boolean>
  removePaymentMethod: (id: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Verificar se o usuário já está logado (localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Erro ao recuperar usuário:", error)
        localStorage.removeItem("user")
      }
    }

    // Load addresses and payment methods
    try {
      // Load addresses
      const storedAddresses = localStorage.getItem("userAddresses")
      if (storedAddresses) {
        const parsedAddresses = JSON.parse(storedAddresses)
        if (Array.isArray(parsedAddresses)) {
          setAddresses(parsedAddresses)
        }
      }

      // Load payment methods
      const storedPaymentMethods = localStorage.getItem("userPaymentMethods")
      if (storedPaymentMethods) {
        const parsedPaymentMethods = JSON.parse(storedPaymentMethods)
        if (Array.isArray(parsedPaymentMethods)) {
          setPaymentMethods(parsedPaymentMethods)
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
    }
  }, [])

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user))
    }
  }, [user])

  // Save addresses to localStorage when they change
  useEffect(() => {
    try {
      if (addresses && addresses.length > 0) {
        localStorage.setItem("userAddresses", JSON.stringify(addresses))
      }
    } catch (error) {
      console.error("Error saving addresses to localStorage:", error)
    }
  }, [addresses])

  // Save payment methods to localStorage when they change
  useEffect(() => {
    try {
      if (paymentMethods && paymentMethods.length > 0) {
        localStorage.setItem("userPaymentMethods", JSON.stringify(paymentMethods))
      }
    } catch (error) {
      console.error("Error saving payment methods to localStorage:", error)
    }
  }, [paymentMethods])

  // Melhorar a função de registro para salvar mais dados e integrar com o checkout
  const register = async (userData: any): Promise<boolean> => {
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if user with this email already exists
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      if (existingUsers.some((u) => u.email === userData.email)) {
        return false
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: "customer",
        createdAt: new Date().toISOString(),
        notifications: userData.notifications || false,
      }

      // Save to "database"
      existingUsers.push(newUser)
      localStorage.setItem("users", JSON.stringify(existingUsers))

      // Auto-login after registration
      setUser(newUser)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(newUser))

      return true
    } catch (error) {
      console.error("Error registering user:", error)
      return false
    }
  }

  // Melhorar a função de login para verificar usuários registrados
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check admin credentials first
      if (email === "admin@restaurante.com" && password === "admin123") {
        const adminUser = {
          id: "1",
          name: "Administrador",
          email: "admin@restaurante.com",
          role: "admin",
        }

        setUser(adminUser)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(adminUser))
        return true
      }

      // For customer login (basic simulation)
      if (email === "cliente@exemplo.com" && password === "senha123") {
        const customerUser = {
          id: "2",
          name: "João Silva",
          email: "cliente@exemplo.com",
          phone: "(11) 98765-4321",
          role: "customer",
          notifications: true,
        }

        setUser(customerUser)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(customerUser))
        return true
      }

      // Check registered users
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const foundUser = existingUsers.find((u) => u.email === email)

      if (foundUser) {
        // In a real app, we would check the password hash
        // For this demo, we'll just accept any password for registered users
        setUser(foundUser)
        setIsAuthenticated(true)
        localStorage.setItem("user", JSON.stringify(foundUser))
        return true
      }

      return false
    } catch (error) {
      console.error("Error logging in:", error)
      return false
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
  }

  // Update profile
  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (user) {
        setUser({
          ...user,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          notifications: userData.notifications,
        })
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating profile:", error)
      return false
    }
  }

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Basic simulation of password check (in a real app, this would be done on the server)
      if (user?.role === "admin" && currentPassword === "admin123") {
        return true
      } else if (user?.role === "customer" && currentPassword === "senha123") {
        return true
      }

      return false
    } catch (error) {
      console.error("Error updating password:", error)
      return false
    }
  }

  // Address management
  const addAddress = async (address: Omit<Address, "id">): Promise<boolean> => {
    try {
      const newAddress: Address = {
        ...address,
        id: `address_${Date.now()}`,
      }

      if (address.isDefault) {
        // If the new address is default, remove default from other addresses
        const updatedAddresses = addresses.map((addr) => ({
          ...addr,
          isDefault: false,
        }))
        setAddresses([...updatedAddresses, newAddress])
      } else {
        setAddresses([...addresses, newAddress])
      }

      return true
    } catch (error) {
      console.error("Error adding address:", error)
      return false
    }
  }

  const updateAddress = async (id: string, address: Omit<Address, "id">): Promise<boolean> => {
    try {
      const updatedAddresses = addresses.map((addr) =>
        addr.id === id ? { ...address, id } : address.isDefault ? { ...addr, isDefault: false } : addr,
      )
      setAddresses(updatedAddresses)
      return true
    } catch (error) {
      console.error("Error updating address:", error)
      return false
    }
  }

  const removeAddress = async (id: string): Promise<boolean> => {
    try {
      const updatedAddresses = addresses.filter((addr) => addr.id !== id)
      setAddresses(updatedAddresses)
      return true
    } catch (error) {
      console.error("Error removing address:", error)
      return false
    }
  }

  // Payment method management
  const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, "id" | "last4">): Promise<boolean> => {
    try {
      const last4 = paymentMethod.cardNumber.slice(-4)

      const newPaymentMethod: PaymentMethod = {
        ...paymentMethod,
        id: `payment_${Date.now()}`,
        last4,
      }

      if (paymentMethod.isDefault) {
        // If the new payment method is default, remove default from other payment methods
        const updatedPaymentMethods = paymentMethods.map((payment) => ({
          ...payment,
          isDefault: false,
        }))
        setPaymentMethods([...updatedPaymentMethods, newPaymentMethod])
      } else {
        setPaymentMethods([...paymentMethods, newPaymentMethod])
      }

      return true
    } catch (error) {
      console.error("Error adding payment method:", error)
      return false
    }
  }

  const updatePaymentMethod = async (
    id: string,
    paymentMethod: Omit<PaymentMethod, "id" | "last4">,
  ): Promise<boolean> => {
    try {
      const last4 = paymentMethod.cardNumber.slice(-4)

      const updatedPaymentMethods = paymentMethods.map((payment) =>
        payment.id === id
          ? { ...paymentMethod, id, last4 }
          : paymentMethod.isDefault
            ? { ...payment, isDefault: false }
            : payment,
      )
      setPaymentMethods(updatedPaymentMethods)
      return true
    } catch (error) {
      console.error("Error updating payment method:", error)
      return false
    }
  }

  const removePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      const updatedPaymentMethods = paymentMethods.filter((payment) => payment.id !== id)
      setPaymentMethods(updatedPaymentMethods)
      return true
    } catch (error) {
      console.error("Error removing payment method:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        paymentMethods,
        addPaymentMethod,
        updatePaymentMethod,
        removePaymentMethod,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}

