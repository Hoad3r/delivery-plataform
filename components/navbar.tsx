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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 sm:h-40 ${
        !isScrolled
          ? "navbar-transparent"
          : "navbar-scrolled shadow-sm"
      }`}
    >
      <div className="w-full h-full px-0">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center h-full ml-0">
            <div className="relative h-28 w-56 sm:h-56 sm:w-[400px] flex items-center justify-center mt-6 ml-[-50px] sm:mt-0 sm:ml-0">
              <Image 
                src="/images/logo.png" 
                alt="Nossa Cozinha" 
                fill 
                className="object-contain"
                priority 
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 mr-4 sm:mr-8 mt-2 sm:mt-4">
            <Link href="/carrinho">
              <Button
                variant="ghost"
                size="icon"
                className={`relative bg-[#DB775F] hover:bg-[#DB775F]/90 text-white h-9 w-9 sm:h-10 sm:w-10`}
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <m.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-[#f3f1e8] text-[#DB775F] text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center"
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
                  size="icon"
                  className="bg-[#DB775F] hover:bg-[#DB775F]/90 text-white h-9 w-9 sm:h-10 sm:w-10"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#f3f1e8]">
                <div className="flex flex-col h-full">
                  <div className="flex-1 py-8">
                    <div className="mb-8 flex justify-center">
                      <div className="relative h-48 w-[280px] sm:h-56 sm:w-[320px]">
                        <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain" />
                      </div>
                    </div>
                    <nav className="space-y-6">
                      <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                          pathname === "/" ? "text-[#DB775F]/80" : ""
                        }`}
                      >
                        Início
                      </Link>
                      <Link
                        href="/cardapio"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                          pathname === "/cardapio" ? "text-[#DB775F]/80" : ""
                        }`}
                      >
                        Menu
                      </Link>
                      <Link
                        href="/sobre"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                          pathname === "/sobre" ? "text-[#DB775F]/80" : ""
                        }`}
                      >
                        Sobre
                      </Link>
                      <Link
                        href="/contato"
                        onClick={() => setIsOpen(false)}
                        className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                          pathname === "/contato" ? "text-[#DB775F]/80" : ""
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
                              className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                                pathname.startsWith("/admin") ? "text-[#DB775F]/80" : ""
                              }`}
                            >
                              Administração
                            </Link>
                          ) : (
                            <>
                              <Link
                                href="/minha-conta"
                                onClick={() => setIsOpen(false)}
                                className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                                  pathname.startsWith("/minha-conta") ? "text-[#DB775F]/80" : ""
                                }`}
                              >
                                Minha Conta
                              </Link>
                              <Link
                                href="/meus-pedidos"
                                onClick={() => setIsOpen(false)}
                                className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                                  pathname.startsWith("/meus-pedidos") ? "text-[#DB775F]/80" : ""
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
                            className="block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors text-left w-full"
                          >
                            Sair
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setIsOpen(false)}
                          className={`block text-xl font-medium text-[#DB775F] hover:text-[#DB775F]/80 transition-colors ${
                            pathname === "/login" ? "text-[#DB775F]/80" : ""
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

