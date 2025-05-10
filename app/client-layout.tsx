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
      {!isCheckout && !isAdminPage && (
        isSimpleFooterPage ? (
          <footer className="bg-neutral-900 text-white py-6">
            <div className="container mx-auto px-3 sm:px-4 text-center">
              <p className="text-neutral-500 font-light text-xs sm:text-sm">
                &copy; {new Date().getFullYear()} Restaurante. Todos os direitos reservados.
              </p>
            </div>
          </footer>
        ) : (
          <Footer />
        )
      )}
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

