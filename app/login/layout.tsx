// Criar um arquivo de layout específico para a página de login
// que não inclui o footer global

"use client"

import type React from "react"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}

