"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [pageLoading, setPageLoading] = useState(true)

  // Adicionar este useEffect logo após as declarações de estado
  useEffect(() => {
    // Definir um pequeno timeout para garantir que o componente esteja totalmente montado
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Melhorar o login para verificar o parâmetro de redirecionamento
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  // Redirect based on role or redirect parameter if authenticated
  if (isAuthenticated) {
    if (user?.role === "admin") {
      router.push("/admin")
    } else if (redirectPath) {
      router.push(redirectPath)
    } else {
      router.push("/minha-conta")
    }
    return null
  }

  // Modificar o retorno do componente para incluir a verificação de carregamento
  // No início do return, antes de qualquer renderização:

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  // Atualizar o handleSubmit para redirecionar corretamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)

      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: user?.role === "admin" ? "Bem-vindo à área administrativa." : "Bem-vindo de volta!",
          variant: "success",
        })

        // Redirect based on role or redirect parameter
        if (user?.role === "admin") {
          router.push("/admin")
        } else if (redirectPath) {
          router.push(redirectPath)
        } else {
          router.push("/minha-conta")
        }
      } else {
        toast({
          title: "Falha no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar fazer login.",
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
          <h1 className="text-3xl font-light mb-2">Área Administrativa</h1>
          <p className="text-neutral-500">Faça login para acessar o painel</p>
        </div>

        <div className="border border-neutral-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurante.com"
                  required
                  className="rounded-none mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-none mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Para fins de demonstração, use:
                  <br />
                  Admin: admin@restaurante.com / admin123
                  <br />
                  Cliente: cliente@exemplo.com / senha123
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-right mt-2">
              <Link href="/recuperar-senha" className="text-xs text-neutral-500 hover:text-black transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>
          </form>
        </div>

        {/* Adicionar link para registro com redirecionamento */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Não possui uma conta?{" "}
            <Link
              href={redirectPath ? `/registro?redirect=${redirectPath}` : "/registro"}
              className="text-black hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

