import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <div className="relative bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: "url('/placeholder.svg?height=800&width=1600')" }}
      />

      <div className="relative container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Sabor & Tradição</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl">
          Experimente os melhores pratos da culinária local, preparados com ingredientes frescos e muito carinho.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/cardapio">
            <Button size="lg" className="text-lg px-8">
              Ver Cardápio
            </Button>
          </Link>
          <Link href="#promocoes">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Promoções
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

