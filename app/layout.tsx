import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { CartProvider } from "@/context/cart-context"
import { MenuProvider } from "@/contexts/menu-context"
import ClientLayout from "./client-layout"
import { Analytics } from "@vercel/analytics/next"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Marmita Saudável - Delivery de Comida Saudável: Nossa Cozinha",
  description: "Receitas equilibradas, saborosas e feitas com cuidado, preparadas com carinho, congeladas para preservar a qualidade e entregues prontas para a sua rotina.",
  verification: {
    google: "aRb_ZPkMysh369ioUVJE61bp2SPfgDHrdOtY5bvwe6E"
  },
  icons: {
    icon: '/favicon.ico'
  }
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
        <Analytics />
      </body>
    </html>
  )
}

