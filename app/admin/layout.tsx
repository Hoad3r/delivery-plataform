"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Redirecionar para a página de login se não estiver autenticado
    if (mounted) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // Verificar se o usuário é admin
      if (user?.role !== "admin") {
        router.push("/minha-conta")
        return
      }
    }
  }, [isAuthenticated, router, mounted, pathname, user?.role])

  // Não renderizar nada até que a autenticação seja verificada
  if (!mounted || !isAuthenticated || user?.role !== "admin") {
    return null
  }

  // Removemos o Navbar completamente da área administrativa
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Removemos o padding-top para evitar o corte do conteúdo */}
      {children}
    </div>
  )
}

