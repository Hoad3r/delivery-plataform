import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import FeaturedDishes from "@/components/featured-dishes"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Minimalista e elegante */}
      <section className="relative h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/food-illustration-bg.png"
            alt="Ilustração de alimentos"
            fill
            className="object-cover brightness-[0.85]"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 z-10 max-w-4xl">
          <div className="text-center text-white space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight">
              Culinária refinada, <br />
              na sua casa
            </h1>
            <p className="text-sm sm:text-lg md:text-xl font-light max-w-2xl mx-auto opacity-90">
              Uma jornada gastronômica que combina sabores autênticos com apresentação impecável, entregue diretamente
              para você
            </p>
            <div className="pt-4 sm:pt-6">
              <Link href="/cardapio">
                <Button
                  variant="outline"
                  size="default"
                  className="rounded-none border-white bg-white/10 backdrop-blur-sm text-white hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm"
                >
                  Explorar Menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre nós - Seção minimalista */}
      <section className="py-12 sm:py-24 bg-secondary/20">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight">Nossa filosofia</h2>
              <div className="w-16 sm:w-20 h-[1px] bg-primary"></div>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Acreditamos que a verdadeira gastronomia transcende o simples ato de alimentar. É uma expressão
                artística que envolve todos os sentidos, criando memórias que perduram muito além da refeição.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Cada prato é cuidadosamente elaborado pelo nosso chef executivo, combinando técnicas clássicas com
                abordagens contemporâneas, sempre respeitando a sazonalidade e a origem dos ingredientes.
              </p>

              {/* Ícones de alimentos */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image src="/images/broccoli.png" alt="Brócolis" fill className="object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image src="/images/tomatoes.png" alt="Tomates" fill className="object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image src="/images/onion.png" alt="Cebola" fill className="object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image src="/images/bread.png" alt="Pão" fill className="object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image src="/images/pie.png" alt="Torta" fill className="object-contain opacity-80" />
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <Image
                      src="/images/salt-pepper.png"
                      alt="Sal e Pimenta"
                      fill
                      className="object-contain opacity-80"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full">
              <Image
                src="/placeholder.svg?height=800&width=600"
                alt="Chef preparando um prato"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes - Elegante e minimalista */}
      <section className="py-12 sm:py-24 bg-accent/30">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight">Especialidades da casa</h2>
            <div className="w-16 sm:w-20 h-[1px] bg-primary mx-auto mt-4 sm:mt-6"></div>
          </div>

          <FeaturedDishes />

          <div className="text-center mt-8 sm:mt-12">
            <Link href="/cardapio">
              <Button
                variant="outline"
                className="rounded-none border-black text-black hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-xs sm:text-sm"
              >
                Ver menu completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery - Minimalista */}
      <section className="py-12 sm:py-24 bg-secondary/20">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6">Delivery premium</h2>
          <div className="w-16 sm:w-20 h-[1px] bg-primary mx-auto mb-6 sm:mb-8"></div>
          <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto mb-6 sm:mb-8">
            Proporcione a si mesmo uma experiência gastronômica memorável sem sair de casa. Nosso serviço de delivery
            foi pensado para preservar a qualidade e apresentação dos pratos, garantindo que você desfrute da mesma
            excelência que oferecemos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mt-8 sm:mt-12">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/30 flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-light text-secondary-foreground">1</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Escolha</h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center">
                Navegue pelo nosso cardápio e selecione seus pratos favoritos
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/30 flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-light text-secondary-foreground">2</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Peça</h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center">
                Finalize seu pedido com apenas alguns cliques
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/30 flex items-center justify-center mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-light text-secondary-foreground">3</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Desfrute</h3>
              <p className="text-xs sm:text-sm text-neutral-500 text-center">
                Receba em casa e aproveite uma experiência gastronômica única
              </p>
            </div>
          </div>
          <div className="mt-8 sm:mt-12">
            <Link href="/cardapio">
              <Button className="rounded-none bg-white text-black hover:bg-primary hover:text-primary-foreground border border-black hover:border-primary transition-colors text-xs sm:text-sm">
                Pedir Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
} 