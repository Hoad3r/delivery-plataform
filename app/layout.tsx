import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./client-layout"
import { MenuProvider } from "@/contexts/menu-context"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/cart-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nossa Cozinha - Marmita Saudável",
  description: "Peça online e receba em casa",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <CartProvider>
          <MenuProvider>
            <ClientLayout>{children}</ClientLayout>
            <Toaster />
          </MenuProvider>
        </CartProvider>
      </body>
    </html>
  )
}

