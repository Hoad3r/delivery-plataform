"use client"

import type React from "react"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ScrollToTop from "@/components/scroll-to-top"
import { usePathname } from "next/navigation"

// Client component to conditionally render navbar and footer
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith("/admin")
  const isSimpleFooterPage = pathname?.startsWith("/sobre") || pathname?.startsWith("/contato")
  const isCheckout = pathname.startsWith("/checkout")

  return (
    <>
      {!isCheckout && !isAdminPage && <Navbar />}
      {children}
      {!isCheckout && !isAdminPage && <Footer />}
    </>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isCheckout = pathname.startsWith("/checkout")
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <LayoutWrapper>
          <main>{children}</main>
        </LayoutWrapper>
        <Toaster />
      </CartProvider>
    </AuthProvider>
  )
}

