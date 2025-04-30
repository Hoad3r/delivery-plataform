"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/context/cart-context"
import { motion as m, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/auth-context"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { cart } = useCart()
  const { isAuthenticated, logout, user } = useAuth()

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10
      console.log("Scroll position:", window.scrollY, "isScrolled:", scrolled)
      setIsScrolled(scrolled)
    }

    // Call handleScroll once on mount to set initial state
    handleScroll()
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isHomePage = pathname === "/"
  
  // Debug values
  console.log("Navbar Debug - isHomePage:", isHomePage, "isScrolled:", isScrolled, "pathname:", pathname)

  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !isScrolled
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-sm shadow-sm"
      }`}
      style={{
        backgroundColor: !isScrolled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-32">
          <Link href="/" className="flex items-center">
            <div className="relative h-28 w-80">
              <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain" priority />
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/carrinho">
              <Button
                variant="ghost"
                size="lg"
                className={`relative bg-[#DB775F] hover:bg-[#DB775F]/90 text-white ${
                  isHomePage && !isScrolled ? "" : ""
                }`}
              >
                <ShoppingBag className="h-6 w-6" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <m.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-white text-[#DB775F] text-xs rounded-full h-6 w-6 flex items-center justify-center"
                    >
                      {totalItems}
                    </m.span>
                  )}
                </AnimatePresence>
              </Button>
            </Link>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="bg-[#DB775F] hover:bg-[#DB775F]/90 text-white"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#f4f1ea]">
                <div className="flex flex-col h-full">
                  <div className="flex-1 py-8">
                    <div className="mb-8 flex justify-center">
                      <div className="relative h-40 w-96">
                        <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain" />
                      </div>
                    </div>
                    <nav className="space-y-6">
                      <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                          pathname === "/" ? "text-[#95B2A0]" : ""
                        }`}
                      >
                        Início
                      </Link>
                      <Link
                        href="/cardapio"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                          pathname === "/cardapio" ? "text-[#95B2A0]" : ""
                        }`}
                      >
                        Menu
                      </Link>
                      <Link
                        href="/sobre"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                          pathname === "/sobre" ? "text-[#95B2A0]" : ""
                        }`}
                      >
                        Sobre
                      </Link>
                      <Link
                        href="/contato"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                          pathname === "/contato" ? "text-[#95B2A0]" : ""
                        }`}
                      >
                        Contato
                      </Link>
                      {isAuthenticated ? (
                        <>
                          {user?.role === "admin" ? (
                            <Link
                              href="/admin"
                              onClick={() => setIsOpen(false)}
                              className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                                pathname.startsWith("/admin") ? "text-[#95B2A0]" : ""
                              }`}
                            >
                              Administração
                            </Link>
                          ) : (
                            <>
                              <Link
                                href="/minha-conta"
                                onClick={() => setIsOpen(false)}
                                className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                                  pathname.startsWith("/minha-conta") ? "text-[#95B2A0]" : ""
                                }`}
                              >
                                Minha Conta
                              </Link>
                              <Link
                                href="/meus-pedidos"
                                onClick={() => setIsOpen(false)}
                                className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                                  pathname.startsWith("/meus-pedidos") ? "text-[#95B2A0]" : ""
                                }`}
                              >
                                Meus Pedidos
                              </Link>
                            </>
                          )}
                          <button
                            onClick={() => {
                              logout()
                              setIsOpen(false)
                            }}
                            className="block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors text-left w-full"
                          >
                            Sair
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setIsOpen(false)}
                          className={`block text-xl font-medium text-[#DB775F] hover:text-[#95B2A0] transition-colors ${
                            pathname === "/login" ? "text-[#95B2A0]" : ""
                          }`}
                        >
                          Entrar
                        </Link>
                      )}
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

