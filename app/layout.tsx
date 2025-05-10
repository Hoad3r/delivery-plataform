import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { MenuProvider } from "@/contexts/menu-context"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nossa Cozinha - Delivery de Comida Refinada",
  description: "Experimente a melhor experiência gastronômica diretamente na sua casa",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <MenuProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster />
            </MenuProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

