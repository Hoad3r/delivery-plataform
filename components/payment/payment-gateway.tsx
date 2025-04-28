"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Lock, ShieldCheck } from "lucide-react"

interface PaymentGatewayProps {
  amount: number
  onPaymentComplete: (paymentId: string) => void
  onCancel: () => void
}

export default function PaymentGateway({ amount, onPaymentComplete, onCancel }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulação de processamento de pagamento
    // Em um ambiente real, você integraria com Stripe, PayPal, etc.
    setTimeout(() => {
      // Gerar um ID de pagamento fictício
      const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`
      onPaymentComplete(paymentId)
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Pagamento Seguro
        </CardTitle>
        <CardDescription>Seus dados estão protegidos com criptografia de ponta a ponta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="credit" id="credit" className="peer sr-only" />
                <Label
                  htmlFor="credit"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Crédito
                </Label>
              </div>
              <div>
                <RadioGroupItem value="debit" id="debit" className="peer sr-only" />
                <Label
                  htmlFor="debit"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Débito
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-4">
              <div>
                <Label htmlFor="card-number">Número do Cartão</Label>
                <Input
                  id="card-number"
                  name="number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={handleInputChange}
                  className="rounded-none mt-1"
                />
              </div>

              <div>
                <Label htmlFor="card-name">Nome no Cartão</Label>
                <Input
                  id="card-name"
                  name="name"
                  placeholder="Nome como aparece no cartão"
                  value={cardDetails.name}
                  onChange={handleInputChange}
                  className="rounded-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Validade</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    placeholder="MM/AA"
                    value={cardDetails.expiry}
                    onChange={handleInputChange}
                    className="rounded-none mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    name="cvc"
                    placeholder="123"
                    value={cardDetails.cvc}
                    onChange={handleInputChange}
                    className="rounded-none mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 p-3 border border-neutral-200">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>Seus dados de pagamento são criptografados e processados com segurança</span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="rounded-none border-black text-black hover:bg-black hover:text-white"
              disabled={isProcessing}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="rounded-none bg-black text-white hover:bg-neutral-800"
              disabled={isProcessing}
            >
              {isProcessing ? "Processando..." : `Pagar R$ ${amount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <div className="flex gap-2 items-center text-xs text-neutral-500">
          <Lock className="h-3 w-3" />
          <span>Pagamento seguro via SSL</span>
        </div>
      </CardFooter>
    </Card>
  )
}

