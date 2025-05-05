"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import FeaturedDishes from "@/components/featured-dishes"
import { motion as m } from "framer-motion"

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-b from-[#f4f1ea] to-white">
        {/* Imagem decorativa */}
        <div
          className="absolute left-0 w-full pointer-events-none select-none z-20 hidden sm:block"
          style={{ top: 200, height: 650 }}
        >
          <Image
            src="/images/decor-frame.png"
            alt="Decoração"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#DB775F]/10 rounded-full transform rotate-12"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#DB775F]/5 rounded-full transform -rotate-12"></div>
        </div>

        <div className="container mx-auto px-0 h-full">
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-[#2F5F53]">
              Culinária refinada, <br />
              <span className="text-[#DB775F]">na sua casa</span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Uma jornada gastronômica que combina sabores autênticos com apresentação impecável, entregue diretamente
              para você
            </p>
            <div className="pt-8">
              <Link href="/cardapio">
                <Button
                  size="lg"
                  className="bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Explorar Menu
                </Button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      {/* Sobre nós - Seção minimalista */}
      <section className="py-16 sm:py-24 bg-[#f4f1ea] relative overflow-hidden">
        {/* Imagens decorativas grandes, animadas, só nas bordas e nunca sobre o texto */}
        <div className="pointer-events-none select-none absolute inset-0 w-full h-full z-0">
          {/* Mobile: só 2 imagens, bem afastadas do texto */}
          <div className="absolute top-[-40px] left-[-60px] w-[180px] h-[180px] opacity-18 rotate-[-10deg] animate-float-img1 sm:w-[380px] sm:h-[380px] sm:top-[-60px] sm:left-[-100px]">
            <Image src="/images/broccoli.png" alt="Brócolis" fill className="object-contain" />
          </div>
          <div className="absolute bottom-[-60px] right-[-40px] w-[160px] h-[160px] opacity-13 rotate-[6deg] animate-float-img4 sm:w-[200px] sm:h-[200px] sm:bottom-[60px] sm:right-[120px]">
            <Image src="/images/salt-pepper.png" alt="Sal e Pimenta" fill className="object-contain" />
          </div>
          {/* Desktop: demais imagens, só aparecem em sm+ e afastadas do centro */}
          <div className="absolute top-[-30px] right-[40px] w-[300px] h-[300px] opacity-18 rotate-[18deg] animate-float-img2 hidden sm:block">
            <Image src="/images/tomatoes.png" alt="Tomates" fill className="object-contain" />
          </div>
          <div className="absolute top-1/3 right-[320px] w-[200px] h-[200px] opacity-15 rotate-[-16deg] animate-float-img3 hidden sm:block">
            <Image src="/images/pie.png" alt="Torta" fill className="object-contain" />
          </div>
          <div className="absolute top-[45%] left-[80px] w-[180px] h-[180px] opacity-14 rotate-[-8deg] animate-float-img5 hidden sm:block">
            <Image src="/images/onion.png" alt="Cebola" fill className="object-contain" />
          </div>
          <div className="absolute bottom-[-100px] left-1/2 w-[340px] h-[340px] opacity-15 -translate-x-1/2 rotate-[10deg] animate-float-img6 hidden sm:block">
            <Image src="/images/bread.png" alt="Pão" fill className="object-contain" />
          </div>
          <div className="absolute bottom-16 left-[180px] w-[160px] h-[160px] opacity-12 rotate-[22deg] animate-float-img7 hidden sm:block">
            <Image src="/images/tomatoes.png" alt="Tomates" fill className="object-contain" />
          </div>
          <div className="absolute top-32 right-1/3 w-[160px] h-[160px] opacity-12 rotate-[-22deg] animate-float-img8 hidden sm:block">
            <Image src="/images/broccoli.png" alt="Brócolis" fill className="object-contain" />
          </div>
        </div>
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
            <m.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4 sm:space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#FF7A3D]">Nossa filosofia</h2>
              <div className="w-16 sm:w-20 h-[1px] bg-[#DB775F]"></div>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Acreditamos que a verdadeira gastronomia transcende o simples ato de alimentar. É uma expressão
                artística que envolve todos os sentidos, criando memórias que perduram muito além da refeição.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Cada prato é cuidadosamente elaborado pelo nosso chef executivo, combinando técnicas clássicas com
                abordagens contemporâneas, sempre respeitando a sazonalidade e a origem dos ingredientes.
              </p>
            </m.div>
            
            <m.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="hidden"
            >
            </m.div>
          </div>
        </div>
      </section>

      {/* Featured Dishes - Elegante e minimalista */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-[#f4f1ea]">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#2F5F53] mb-4">Especialidades da casa</h2>
            <div className="w-24 h-[2px] bg-[#DB775F] mx-auto"></div>
            <p className="text-neutral-600 mt-6 max-w-2xl mx-auto">
              Descubra nossos pratos mais requintados, preparados com ingredientes selecionados e técnicas refinadas
            </p>
          </m.div>

          <FeaturedDishes />

          <div className="text-center mt-12 sm:mt-16">
            <Link href="/cardapio">
              <Button
                size="lg"
                className="bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
              >
                Ver menu completo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery - Minimalista */}
      <section className="py-16 sm:py-24 bg-[#f4f1ea]">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6 text-[#2F5F53]">Delivery premium</h2>
            <div className="w-16 sm:w-20 h-[1px] bg-[#DB775F] mx-auto mb-6 sm:mb-8"></div>
            <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto mb-6 sm:mb-8">
              Proporcione a si mesmo uma experiência gastronômica memorável sem sair de casa. Nosso serviço de delivery
              foi pensado para preservar a qualidade e apresentação dos pratos, garantindo que você desfrute da mesma
              excelência que oferecemos.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mt-8 sm:mt-12">
              <m.div 
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#DB775F]/20 flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-light text-[#DB775F]">1</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-[#95B2A0]">Escolha</h3>
                <p className="text-xs sm:text-sm text-neutral-500 text-center">
                  Navegue pelo nosso cardápio e selecione seus pratos favoritos
                </p>
              </m.div>
              
              <m.div 
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#DB775F]/20 flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-light text-[#DB775F]">2</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-[#95B2A0]">Peça</h3>
                <p className="text-xs sm:text-sm text-neutral-500 text-center">
                  Finalize seu pedido com apenas alguns cliques
                </p>
              </m.div>
              
              <m.div 
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#DB775F]/20 flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl font-light text-[#DB775F]">3</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-[#95B2A0]">Desfrute</h3>
                <p className="text-xs sm:text-sm text-neutral-500 text-center">
                  Receba em casa e aproveite uma experiência gastronômica única
                </p>
              </m.div>
            </div>
            <div className="mt-8 sm:mt-12">
              <Link href="/cardapio">
                <Button
                  className="bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Pedir Agora
                </Button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>
    </main>
  )
} 