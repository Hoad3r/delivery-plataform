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
      <section className="relative min-h-screen flex items-center bg-gradient-to-b from-[#f4f1ea] to-white overflow-hidden">
        {/* Imagem decorativa - Desktop */}
        <div
          className="absolute left-0 w-full pointer-events-none select-none z-20 hidden lg:block"
          style={{ 
            top: '50%',
            transform: 'translateY(-50%)',
            height: 'min(80vh, 650px)',
            maxWidth: '1400px',
            margin: '0 auto',
            right: 0,
            left: 0
          }}
        >
          <Image
            src="/images/decor-frame.png"
            alt="Decoração"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[#DB775F]/10 rounded-full transform rotate-12"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-[#DB775F]/5 rounded-full transform -rotate-12"></div>
        </div>

        <div className="container mx-auto px-4 h-full relative z-30 max-w-[1400px]">
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 py-20"
          >
            <h1 className="font-light tracking-tight text-[#2F5F53] max-w-[1200px] mx-auto leading-tight text-[clamp(2.5rem,7vw,4rem)]">
              Culinária refinada, <br />
              <span className="text-[#DB775F]">na sua casa</span>
            </h1>
            <p className="text-[clamp(1rem,2.5vw,1.5rem)] text-neutral-600 max-w-2xl mx-auto">
              Uma jornada gastronômica que combina sabores autênticos com apresentação impecável, entregue diretamente
              para você
            </p>
            <div className="pt-8">
              <Link href="/cardapio">
                <Button
                  size="lg"
                  className="bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 px-[clamp(2rem,4vw,3rem)] py-[clamp(1rem,2vw,1.5rem)] text-[clamp(1rem,2vw,1.25rem)] rounded-full shadow-lg hover:shadow-xl hover:scale-105 max-w-full"
                >
                  Explorar Menu
                </Button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      {/* Sobre nós - Seção minimalista */}
      <section className="py-16 sm:py-24 relative overflow-hidden min-h-[400px]">
        {/* Imagem de fundo cobrindo toda a seção, sem overlay */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src="/images/filosofia.png"
            alt="Filosofia fundo"
            fill
            className="object-cover w-full h-full"
            priority
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>
        <div className="container mx-auto px-3 sm:px-4 max-w-[1200px] relative z-10 h-full">
          <div className="flex items-center justify-end min-h-[400px] h-full">
            <div className="space-y-4 sm:space-y-6 max-w-xl ml-auto px-6 py-8 pl-[8vw] sm:pl-6" style={{ paddingLeft: 'clamp(24px, 8vw, 80px)' }}>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#FF7A3D]">Nossa filosofia</h2>
              <div className="w-16 sm:w-20 h-[1px] bg-[#DB775F]"></div>
              <p className="text-sm sm:text-base text-neutral-900 leading-relaxed">
                Acreditamos que a verdadeira gastronomia transcende o simples ato de alimentar. É uma expressão
                artística que envolve todos os sentidos, criando memórias que perduram muito além da refeição.
              </p>
              <p className="text-sm sm:text-base text-neutral-900 leading-relaxed">
                Cada prato é cuidadosamente elaborado pelo nosso chef executivo, combinando técnicas clássicas com
                abordagens contemporâneas, sempre respeitando a sazonalidade e a origem dos ingredientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes - Elegante e minimalista */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-[#f4f1ea]">
        <div className="container mx-auto px-3 sm:px-4 max-w-[1200px]">
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
              Conheça nossos pratos especiais, cuidadosamente elaborados com ingredientes naturais e combinações nutritivas, pensados para levar mais leveza e sabor ao seu dia a dia.
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
        <div className="container mx-auto px-3 sm:px-4 max-w-[1000px] text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6 text-[#2F5F53]">Delivery</h2>
            <div className="w-16 sm:w-20 h-[1px] bg-[#DB775F] mx-auto mb-6 sm:mb-8"></div>
            <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto mb-6 sm:mb-8">
            Preparamos nossas marmitas com cuidado e entregamos todas às terças e quartas, mantendo o frescor, a apresentação e o capricho de sempre. É praticidade para a sua rotina, com refeições equilibradas e feitas com ingredientes que respeitam o seu bem-estar.
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
                  Receba nossas marmitas com sabor e qualidade direto na sua casa.
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
