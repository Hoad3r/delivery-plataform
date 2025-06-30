"use client"
// deploy
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  CreditCard,
  MapPin,
  Truck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Wallet,
  QrCode,
  Banknote,
  User,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Suspense } from "react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, getDocs, query, doc, updateDoc, getDoc } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define validation schema
const checkoutSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  paymentMethod: z.enum(["pix", "credit", "cash"]),
  name: z.string().min(3, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().min(10, "Número de telefone inválido").optional(),
  streetName: z.string().optional(),
  postalCode: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  referencePoint: z.string().optional(),
  saveAddress: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Se for entrega, os campos de endereço são obrigatórios
  if (data.deliveryMethod === "delivery") {
    return data.streetName && data.postalCode && data.number;
  }
  // Se for retirada, os campos de endereço não são necessários
  return true;
}, {
  message: "Para entrega, preencha todos os campos de endereço obrigatórios",
  path: ["streetName"] // Mostra o erro no campo streetName
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>

const CheckoutContent = dynamic(() => import("./checkout-content"), { ssr: false })

export default function Page() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-24 max-w-3xl pt-28"><div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8"><div className="flex flex-col items-center justify-center text-center space-y-4"><div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" /><h2 className="text-2xl font-light">QR Code PIX sendo gerado...</h2><p className="text-neutral-500">Por favor, aguarde enquanto geramos o QR Code para pagamento.</p></div></div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

