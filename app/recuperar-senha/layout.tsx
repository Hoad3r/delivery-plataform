// Criar um arquivo de layout específico para a página de recuperação de senha
// que não inclui o footer global

"use client"

import type React from "react"

export default function RecoverPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}

