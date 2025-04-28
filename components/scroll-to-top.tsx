"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Quando o pathname mudar, role para o topo da página
    window.scrollTo({
      top: 0,
      behavior: "instant", // Usamos "instant" em vez de "smooth" para evitar animação estranha
    })
  }, [pathname])

  return null // Este componente não renderiza nada visualmente
}

