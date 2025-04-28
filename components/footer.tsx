import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-accent/30 border-t border-neutral-200 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="relative h-28 w-80 mx-auto md:mx-0 mb-4">
              <Image src="/images/logo.png" alt="Nossa Cozinha" fill className="object-contain" />
            </div>
            <p className="text-sm text-neutral-500 max-w-xs">
              Culinária refinada, na sua casa. Uma experiência gastronômica excepcional desde 2010.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex space-x-4">
              <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white/50 px-3 py-2 rounded-full">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5V21H19V11Z" />
                <path d="M17 9V8C17 5.2 14.8 3 12 3C9.2 3 7 5.2 7 8V9" />
              </svg>
              <span>Pagamento 100% seguro</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Nossa Cozinha. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-neutral-400">
            <Link href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/login" className="hover:text-primary transition-colors">
              Área Administrativa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

