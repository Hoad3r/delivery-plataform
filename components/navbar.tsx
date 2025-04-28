"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/context/cart-context"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/context/auth-context"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { cart } = useCart()
  const { isAuthenticated, logout, user } = useAuth()

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Determinar se estamos na página inicial
  const isHomePage = pathname === "/"

  // Don't render navbar on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHomePage && !isScrolled
          ? "bg-transparent text-white"
          : "bg-background/95 backdrop-blur-sm text-black shadow-sm"
      }`}
    >
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center -ml-3 -my-2 pl-0">
            <div className="relative h-20 w-60 sm:h-28 sm:w-80 ml-0">
              <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain object-left" priority />
            </div>
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link href="/carrinho">
              <Button
                variant="ghost"
                size="sm"
                className={`relative cart-icon ${
                  isHomePage && !isScrolled ? "bg-white/10 hover:bg-white/20 backdrop-blur-sm" : "hover:bg-primary/10"
                }`}
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`absolute -top-1 -right-1 ${
                        isHomePage && !isScrolled ? "bg-white text-black" : "bg-primary text-primary-foreground"
                      } text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs`}
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    isHomePage && !isScrolled ? "bg-white/10 hover:bg-white/20 backdrop-blur-sm" : "hover:bg-primary/10"
                  }
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px] md:w-[400px] bg-background">
                <div className="flex flex-col h-full">
                  <div className="flex-1 py-8 sm:py-12">
                    <div className="mb-8 flex justify-center">
                      <div className="relative h-28 w-80">
                        <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain" />
                      </div>
                    </div>
                    <nav className="flex flex-col items-start space-y-4 sm:space-y-6">
                      <Link
                        href="/"
                        className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname === "/" ? "text-black" : "text-neutral-600"}`}
                      >
                        Início
                      </Link>
                      <Link
                        href="/cardapio"
                        className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname === "/cardapio" ? "text-black" : "text-neutral-600"}`}
                      >
                        Menu
                      </Link>
                      <Link
                        href="/sobre"
                        className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname === "/sobre" ? "text-black" : "text-neutral-600"}`}
                      >
                        Sobre
                      </Link>
                      <Link
                        href="/contato"
                        className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname === "/contato" ? "text-black" : "text-neutral-600"}`}
                      >
                        Contato
                      </Link>
                      {isAuthenticated ? (
                        <>
                          {/* Show admin link for admin users */}
                          {isAuthenticated && user?.role === "admin" ? (
                            <Link
                              href="/admin"
                              className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname.startsWith("/admin") ? "text-black" : "text-neutral-600"}`}
                            >
                              Administração
                            </Link>
                          ) : (
                            <Link
                              href="/minha-conta"
                              className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname.startsWith("/minha-conta") ? "text-black" : "text-neutral-600"}`}
                            >
                              Minha Conta
                            </Link>
                          )}
                          <button
                            onClick={logout}
                            className="text-xl sm:text-2xl font-light hover:text-primary transition-colors text-neutral-600 text-left"
                          >
                            Sair
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          className={`text-xl sm:text-2xl font-light hover:text-primary transition-colors ${pathname === "/login" ? "text-black" : "text-neutral-600"}`}
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

