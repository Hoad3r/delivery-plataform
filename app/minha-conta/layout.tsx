"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { User, MapPin, CreditCard, ShoppingBag, LogOut, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Evitar renderização no servidor
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        // Só desativa o loading quando confirmamos que está autenticado
        setIsLoading(false)

        // Check if user is admin and redirect to admin page
        if (user?.role === "admin" && pathname === "/minha-conta") {
          router.push("/admin")
          return
        }

        // Redirecionar para a página de perfil se estiver na raiz de minha-conta (apenas para usuários normais)
        if (pathname === "/minha-conta" && user?.role !== "admin") {
          router.push("/minha-conta/perfil")
        }
      }
    }
  }, [isAuthenticated, router, mounted, pathname, user?.role])

  // Don't render anything until authentication is verified and component is mounted
  if (!mounted || isLoading) {
    // Retornar um div vazio com altura mínima para evitar saltos de layout
    return <div className="min-h-screen"></div>
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl pt-36">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-light mb-2">Minha Conta</h1>
          <p className="text-neutral-500">Olá, {user.name}! Gerencie suas informações e pedidos.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link href="/">
            <Button
              variant="outline"
              className="rounded-none border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Home className="h-4 w-4 mr-2" /> Voltar ao Início
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-none border-black text-black hover:bg-black hover:text-white"
            onClick={() => {
              logout()
              router.push("/")
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      <Separator className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden shadow-sm">
            <div className="p-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-neutral-600">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="p-3">
              <div className="space-y-1">
                {user?.role === "admin" ? (
                  <NavLink href="/admin" active={pathname.startsWith("/admin")} icon={<User className="h-4 w-4" />}>
                    Painel Administrativo
                  </NavLink>
                ) : (
                  <>
                    <NavLink
                      href="/minha-conta/perfil"
                      active={pathname === "/minha-conta/perfil" || pathname === "/minha-conta"}
                      icon={<User className="h-4 w-4" />}
                    >
                      Meu Perfil
                    </NavLink>
                    <NavLink
                      href="/minha-conta/enderecos"
                      active={pathname === "/minha-conta/enderecos"}
                      icon={<MapPin className="h-4 w-4" />}
                    >
                      Endereços
                    </NavLink>
                    <NavLink
                      href="/minha-conta/pagamentos"
                      active={pathname === "/minha-conta/pagamentos"}
                      icon={<CreditCard className="h-4 w-4" />}
                    >
                      Métodos de Pagamento
                    </NavLink>
                    <NavLink
                      href="/minha-conta/pedidos"
                      active={pathname === "/minha-conta/pedidos"}
                      icon={<ShoppingBag className="h-4 w-4" />}
                    >
                      Meus Pedidos
                    </NavLink>
                  </>
                )}
              </div>
            </nav>
          </div>

          <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-sm shadow-sm border border-neutral-100">
            <h3 className="font-medium mb-3 flex items-center gap-2 text-neutral-800">
              <ShoppingBag className="h-4 w-4 text-primary" /> Faça um novo pedido
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Explore nosso cardápio e descubra novas opções deliciosas para seu próximo pedido.
            </p>
            <Link href="/cardapio">
              <Button className="w-full rounded-none bg-primary text-white hover:bg-primary/90" size="sm">
                Ver Cardápio
              </Button>
            </Link>
          </div>

          <div className="mt-4 p-5 bg-white rounded-sm shadow-sm border border-neutral-100">
            <h3 className="font-medium mb-3 flex items-center gap-2 text-neutral-800">
              <ShoppingBag className="h-4 w-4 text-primary" /> Precisa de ajuda?
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Entre em contato com nosso suporte para qualquer dúvida sobre seus pedidos ou conta.
            </p>
            <Link href="/contato">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-white"
              >
                Falar com Suporte
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  )
}

function NavLink({
  href,
  active,
  children,
  icon,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  icon: React.ReactNode
}) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-colors ${
          active
            ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-medium shadow-sm"
            : "text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        {icon}
        {children}
      </div>
    </Link>
  )
}

