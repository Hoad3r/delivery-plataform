"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

// Define validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Initialize form
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true)

    try {
      // Simulate API call to request password reset
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      toast({
        title: "Email enviado",
        description: "As instruções para redefinir sua senha foram enviadas para seu email.",
      })

      setSubmitted(true)
    } catch (error) {
      toast({
        title: "Erro ao processar solicitação",
        description: "Ocorreu um erro ao tentar enviar o email de recuperação.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-light mb-2">Recuperar Senha</h1>
          <p className="text-neutral-500">Enviaremos instruções para seu email</p>
        </div>

        <div className="border border-neutral-200 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2">Email Enviado</h2>
              <p className="text-neutral-500 mb-4">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-none border-black text-black hover:bg-black hover:text-white"
                >
                  Voltar para Login
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="rounded-none mt-1"
                          placeholder="Digite seu email"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full rounded-none bg-black text-white hover:bg-neutral-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Instruções"}
                </Button>
              </form>
            </Form>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Lembrou sua senha?{" "}
            <Link href="/login" className="text-black hover:underline">
              Voltar para login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

