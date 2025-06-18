"use client"

import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function OrderConfirmedPage() {
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
            Pagamento Confirmado!
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-600"
          >
            Seu pagamento foi confirmado com sucesso.<br />
            Em instantes seu pedido estará em preparo.
          </motion.p>
        </div>

        <div className="p-8 flex flex-col items-center justify-center gap-6">
          <p className="text-neutral-600 text-center">
            Você pode acompanhar o status do seu pedido em tempo real.
          </p>
          <Link href="/minha-conta/pedidos">
            <Button className="rounded-none bg-primary text-white hover:bg-primary/90">
              Acompanhar Pedido <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

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
      </motion.div>
    </div>
  )
}

