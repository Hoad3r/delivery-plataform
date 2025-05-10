"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

// Função para formatar o telefone
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_, ddd, part1, part2) => {
      if (part2) return `(${ddd}) ${part1}-${part2}`
      if (part1) return `(${ddd}) ${part1}`
      return `(${ddd}`
    })
  }
  return value
}

// Define the validation schema
const registerSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z
      .string()
      .min(14, "Telefone inválido")
      .max(15, "Telefone inválido")
      .refine((value) => {
        const numbers = value.replace(/\D/g, '')
        return numbers.length >= 10 && numbers.length <= 11
      }, "Telefone inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
    notifications: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { toast } = useToast()
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      notifications: false,
    },
  })

  // Handle form submission
  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true)

    try {
      // Registrar o usuário com preferência de notificações
      const success = await register({
        name: values.name,
        email: values.email,
        phone: values.phone.replace(/\D/g, ''), // Remove caracteres não numéricos
        password: values.password,
        notifications: values.notifications || false,
      })

      if (success) {
        toast({
          title: "Registro realizado com sucesso",
          description: "Sua conta foi criada. Você já está logado e será redirecionado.",
          variant: "default",
        })

        // Redirecionar para página de conta ou página anterior
        setTimeout(() => {
          const redirectPath = searchParams.get("redirect")
          if (redirectPath) {
            router.push(redirectPath)
          } else {
            router.push("/minha-conta")
          }
        }, 1500)
      } else {
        toast({
          title: "Erro no registro",
          description: "Este email já está em uso. Tente outro ou faça login.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro ao tentar criar sua conta.",
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
          <h1 className="text-3xl font-light mb-2">Criar Conta</h1>
          <p className="text-neutral-500">Registre-se para pedir suas refeições</p>
        </div>

        <div className="border border-neutral-200 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-none mt-1"
                        placeholder="Digite seu nome completo"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-none mt-1"
                        placeholder="(00) 00000-0000"
                        disabled={isLoading}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          field.onChange(formatted)
                        }}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="rounded-none mt-1"
                          placeholder="Digite sua senha"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          className="rounded-none mt-1"
                          placeholder="Confirme sua senha"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal cursor-pointer">Receber notificações</FormLabel>
                      <p className="text-sm text-neutral-500">
                        Desejo receber notificações sobre promoções, novidades e atualizações dos meus pedidos.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Já possui uma conta?{" "}
            <Link
              href={searchParams.get("redirect") ? `/login?redirect=${searchParams.get("redirect")}` : "/login"}
              className="text-black hover:underline"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

