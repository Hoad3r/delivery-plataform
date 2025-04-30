"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Copy, QrCode, ArrowRight, Clock, Truck, MapPin, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export default function OrderConfirmedPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [orderNumber] = useState(() => Math.floor(10000 + Math.random() * 90000))
  const [pixCode] = useState(
    "00020126580014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028-f142082d7b5802152123456789abcdef5204000053039865802BR5913Restaurant App6008Sao Paulo62070503***63041234",
  )

  // Simulate order status
  const [orderStatus, setOrderStatus] = useState("waiting_payment")
  const [paymentTimer, setPaymentTimer] = useState(10)

  useEffect(() => {
    console.log("Montando página de confirmação...")
    // Delay maior para garantir que o carrinho foi limpo e a transição está suave
    const mountTimer = setTimeout(() => {
    setMounted(true)
      console.log("Página de confirmação montada")
    }, 1000)

    // Simulate payment confirmation after 10 seconds
    const paymentTimer = setTimeout(() => {
      console.log("Simulando confirmação de pagamento...")
      setOrderStatus("preparing")
      toast({
        title: "Pagamento confirmado!",
        description: "Seu pedido está sendo preparado.",
      })
    }, 10000)

    return () => {
      console.log("Desmontando página de confirmação...")
      clearTimeout(mountTimer)
      clearTimeout(paymentTimer)
    }
  }, [toast])

  // Countdown timer for payment
  useEffect(() => {
    if (orderStatus === "waiting_payment" && paymentTimer > 0) {
      const timer = setTimeout(() => setPaymentTimer(paymentTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [orderStatus, paymentTimer])

  // Countdown timer for order preparation
  useEffect(() => {
    if (orderStatus === "preparing" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 60000)
      return () => clearTimeout(timer)
    }
  }, [orderStatus, countdown])

  // Copy PIX code to clipboard
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    toast({
      title: "Código PIX copiado!",
      description: "O código PIX foi copiado para a área de transferência.",
    })
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-3xl pt-28">
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <h2 className="text-2xl font-light">Preparando sua confirmação...</h2>
            <p className="text-neutral-500">Aguarde um momento enquanto confirmamos seu pedido.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-24 max-w-3xl pt-28">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm"
      >
        <div className="p-8 text-center border-b border-neutral-200 bg-gradient-to-r from-primary/20 to-secondary/20">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4"
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-light mb-2"
          >
            Pedido Confirmado!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-600"
          >
            Seu pedido #{orderNumber} foi recebido com sucesso.
          </motion.p>
        </div>

        <div className="p-8">
          {orderStatus === "waiting_payment" ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-medium mb-2">Aguardando Pagamento</h2>
                <p className="text-neutral-600 mb-6">
                  Para finalizar seu pedido, realize o pagamento via PIX usando o QR Code abaixo.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="bg-white p-6 border border-neutral-200 rounded-sm mb-4 shadow-sm"
                >
                  <QrCode className="h-48 w-48 text-neutral-800" />
                </motion.div>
                <p className="text-sm text-neutral-500 mb-4">Escaneie o QR Code com o aplicativo do seu banco</p>
              </div>

              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Código PIX Copia e Cola</h3>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary" onClick={copyPixCode}>
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                </div>
                <p className="text-xs text-neutral-600 bg-white p-3 border border-neutral-200 rounded-sm break-all">
                  {pixCode}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <Clock className="h-4 w-4" /> Aguardando confirmação do pagamento... ({paymentTimer}s)
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-medium mb-2">Pagamento Confirmado!</h2>
                <p className="text-neutral-600 mb-6">
                  Seu pedido está sendo preparado e ficará pronto em aproximadamente {countdown} minutos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" /> Status do Pedido
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Número do Pedido:</span>
                      <span className="font-medium">#{orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Status:</span>
                      <span className="font-medium text-primary">Em Preparo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Tempo Estimado:</span>
                      <span className="font-medium">{countdown} minutos</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-sm">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Informações de Pagamento
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Método:</span>
                      <span className="font-medium">PIX</span>
                  </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Status:</span>
                      <span className="font-medium text-green-600">Confirmado</span>
                  </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-neutral-600 text-center">Você receberá atualizações sobre o status do seu pedido.</p>
                <Link href="/minha-conta/pedidos">
                  <Button className="rounded-none bg-primary text-white hover:bg-primary/90">
                    Acompanhar Pedido <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
            <p className="text-neutral-500 mb-4">
              Obrigado por escolher nosso restaurante! Esperamos que aproveite sua refeição.
            </p>
            <Link href="/cardapio">
              <Button
                variant="outline"
                className="rounded-none border-primary text-primary hover:bg-primary hover:text-white"
              >
                Voltar ao Cardápio
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

