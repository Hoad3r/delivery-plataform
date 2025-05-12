"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as updateFirebasePassword
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  logout: () => Promise<void>
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

  // Observar mudanças no estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Buscar dados adicionais do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        const userData = userDoc.data()

        const user: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          phone: userData?.phone,
          role: userData?.role || 'customer',
          notifications: userData?.notifications || false
        }

        setUser(user)
        setIsAuthenticated(true)

        // Carregar endereços e métodos de pagamento
        if (userData?.addresses) {
          setAddresses(userData.addresses)
        }
        if (userData?.paymentMethods) {
          setPaymentMethods(userData.paymentMethods)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setAddresses([])
        setPaymentMethods([])
        }
    })

    return () => unsubscribe()
  }, [])

  const register = async (userData: any): Promise<boolean> => {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )

      // Atualizar o perfil com o nome
      await updateFirebaseProfile(userCredential.user, {
        displayName: userData.name
      })

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'customer',
        notifications: userData.notifications || false,
        addresses: [],
        paymentMethods: [],
        createdAt: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error("Erro ao registrar usuário:", error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("=== INÍCIO DO PROCESSO DE LOGIN ===");
      console.log("Email recebido:", email);
      
      console.log("Tentando fazer login com Firebase Auth...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login bem sucedido:", userCredential.user.uid);
      
      return true;
    } catch (error: any) {
      console.log("=== ERRO NO LOGIN ===");
      console.log("Erro completo:", error);
      console.log("Código do erro:", error?.code);
      console.log("Mensagem do erro:", error?.message);
      
      if (error?.code === "auth/invalid-credential") {
        console.log("Verificando se o email existe no Firestore...");
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        console.log("Verificação no Firestore:", querySnapshot.empty ? "Email não encontrado" : "Email encontrado");
        
        if (querySnapshot.empty) {
          console.log("Email não encontrado no Firestore - redirecionando para registro");
          return false;
        } else {
          console.log("Email encontrado no Firestore - senha incorreta");
          return false;
        }
      } else if (error?.code === "auth/user-not-found") {
        console.log("Usuário não encontrado");
      } else if (error?.code === "auth/too-many-requests") {
        console.log("Muitas tentativas de login");
      }
      
      return false;
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
  }
  }

  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      if (!user) return false

      // Atualizar perfil no Firebase Auth
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: userData.name
        })
      }

      // Atualizar dados no Firestore
      await updateDoc(doc(db, 'users', user.id), {
        name: userData.name,
        phone: userData.phone,
        notifications: userData.notifications
      })

        setUser({
          ...user,
          name: userData.name,
          phone: userData.phone,
        notifications: userData.notifications
        })

        return true
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      return false
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!auth.currentUser) return false

      // Reautenticar o usuário antes de mudar a senha
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Atualizar a senha
      await updateFirebasePassword(auth.currentUser, newPassword)
        return true
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      return false
    }
  }

  const addAddress = async (address: Omit<Address, "id">): Promise<boolean> => {
    try {
      if (!user) return false

      const newAddress = {
        ...address,
        id: `addr_${Date.now()}`
      }

      const updatedAddresses = [...addresses, newAddress]
      await updateDoc(doc(db, 'users', user.id), {
        addresses: updatedAddresses
      })

      setAddresses(updatedAddresses)
      return true
    } catch (error) {
      console.error("Erro ao adicionar endereço:", error)
      return false
    }
  }

  const updateAddress = async (id: string, address: Omit<Address, "id">): Promise<boolean> => {
    try {
      if (!user) return false

      const updatedAddresses = addresses.map(addr =>
        addr.id === id ? { ...address, id } : addr
      )

      await updateDoc(doc(db, 'users', user.id), {
        addresses: updatedAddresses
      })

      setAddresses(updatedAddresses)
      return true
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error)
      return false
    }
  }

  const removeAddress = async (id: string): Promise<boolean> => {
    try {
      if (!user) return false

      const updatedAddresses = addresses.filter(addr => addr.id !== id)
      await updateDoc(doc(db, 'users', user.id), {
        addresses: updatedAddresses
      })

      setAddresses(updatedAddresses)
      return true
    } catch (error) {
      console.error("Erro ao remover endereço:", error)
      return false
    }
  }

  const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, "id" | "last4">): Promise<boolean> => {
    try {
      if (!user) return false

      const newPaymentMethod = {
        ...paymentMethod,
        id: `pm_${Date.now()}`,
        last4: paymentMethod.cardNumber.slice(-4)
      }

      const updatedPaymentMethods = [...paymentMethods, newPaymentMethod]
      await updateDoc(doc(db, 'users', user.id), {
        paymentMethods: updatedPaymentMethods
      })

      setPaymentMethods(updatedPaymentMethods)
      return true
    } catch (error) {
      console.error("Erro ao adicionar método de pagamento:", error)
      return false
    }
  }

  const updatePaymentMethod = async (
    id: string,
    paymentMethod: Omit<PaymentMethod, "id" | "last4">
  ): Promise<boolean> => {
    try {
      if (!user) return false

      const updatedPaymentMethods = paymentMethods.map(pm =>
        pm.id === id ? { ...paymentMethod, id, last4: paymentMethod.cardNumber.slice(-4) } : pm
      )

      await updateDoc(doc(db, 'users', user.id), {
        paymentMethods: updatedPaymentMethods
      })

      setPaymentMethods(updatedPaymentMethods)
      return true
    } catch (error) {
      console.error("Erro ao atualizar método de pagamento:", error)
      return false
    }
  }

  const removePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      if (!user) return false

      const updatedPaymentMethods = paymentMethods.filter(pm => pm.id !== id)
      await updateDoc(doc(db, 'users', user.id), {
        paymentMethods: updatedPaymentMethods
      })

      setPaymentMethods(updatedPaymentMethods)
      return true
    } catch (error) {
      console.error("Erro ao remover método de pagamento:", error)
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
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

