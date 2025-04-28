// Make sure there are no context providers here
import type React from "react"

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Não incluímos o Footer aqui para que ele não apareça na página do carrinho
  return <>{children}</>
}

