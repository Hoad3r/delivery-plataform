import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, Mail, Phone } from "lucide-react"

export default function ContatoPage() {
  // Número de WhatsApp (formato internacional sem símbolos)
  const whatsappNumber = "5511987654321"

  // Mensagem pré-definida (codificada para URL)
  const message = encodeURIComponent("Olá! Gostaria de saber mais sobre o restaurante e fazer um pedido.")

  // URL completa do WhatsApp
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

  return (
    <div className="container mx-auto px-3 sm:px-6 py-24 sm:py-32 max-w-5xl">
      <div className="text-center mb-8 sm:mb-12 pt-8">
        <h1 className="text-2xl sm:text-4xl font-light tracking-tight">Fale Conosco</h1>
        <div className="w-16 sm:w-20 h-[1px] bg-neutral-300 mx-auto mt-4 sm:mt-6"></div>
      </div>

      {/* Hero section com WhatsApp */}
      <div className="relative rounded-lg overflow-hidden mb-12 sm:mb-16">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="relative h-[200px] sm:h-[300px]">
          <Image
            src="/placeholder.svg?height=600&width=1200"
            alt="Atendimento personalizado"
            fill
            className="object-cover"
          />
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-4">
          <h2 className="text-xl sm:text-3xl font-light mb-3 sm:mb-4 text-center">Atendimento rápido via WhatsApp</h2>
          <p className="text-sm sm:text-base text-center max-w-md mb-6 sm:mb-8 text-white/80">
            Tire suas dúvidas, faça seu pedido ou reserve uma mesa diretamente pelo WhatsApp
          </p>

          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button className="rounded-full bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105">
              <svg
                viewBox="0 0 32 32"
                className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 2C8.28 2 2 8.28 2 16C2 18.9728 2.90933 21.6822 4.42667 23.8683L2.52 29.48L8.32667 27.6133C10.4333 29.0133 13.1067 29.8333 16 29.8333C23.72 29.8333 30 23.5533 30 15.8333C30 12.0733 28.52 8.59333 25.9 5.97333C23.28 3.35333 19.76 2 16 2ZM22.9867 21.0333C22.6667 21.9533 21.2933 22.7333 20.2333 22.9533C19.48 23.1 18.52 23.2133 15.3667 21.9533C11.3667 20.3933 8.8 16.3133 8.56 16C8.33333 15.6867 7 13.8333 7 11.9133C7 10 7.96 9.09333 8.4 8.64C8.76 8.26667 9.33333 8.1 9.88 8.1C10.04 8.1 10.2 8.1 10.3333 8.11333C10.7333 8.13333 10.9333 8.16 11.2 8.76C11.5333 9.52 12.2933 11.4333 12.4 11.6667C12.5133 11.9 12.6267 12.2 12.4667 12.4867C12.32 12.7867 12.1867 12.9333 11.9533 13.2C11.72 13.4667 11.5 13.6667 11.2667 13.96C11.0533 14.2133 10.8133 14.48 11.08 14.9133C11.3467 15.3333 12.1067 16.56 13.2 17.5333C14.6 18.7733 15.7333 19.16 16.2 19.3733C16.5467 19.5333 16.9667 19.5 17.2267 19.2C17.56 18.8267 17.9733 18.1933 18.3933 17.5733C18.6933 17.12 19.0933 17.0533 19.5133 17.2133C19.9467 17.36 21.8533 18.2933 22.32 18.5267C22.7867 18.76 23.0933 18.8733 23.2067 19.0667C23.3067 19.2733 23.3067 20.1 22.9867 21.0333Z"
                />
              </svg>
              <span className="text-sm sm:text-base">Conversar no WhatsApp</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de informações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-neutral-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-neutral-50 p-4 flex flex-col items-center text-center">
              <MapPin className="h-6 w-6 text-neutral-700 mb-3" />
              <h3 className="font-medium text-sm sm:text-base mb-2">Endereço</h3>
              <p className="text-neutral-500 text-xs sm:text-sm">
                Rua das Oliveiras, 123
                <br />
                Jardim Primavera
                <br />
                São Paulo, SP - 01234-567
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-neutral-50 p-4 flex flex-col items-center text-center">
              <Phone className="h-6 w-6 text-neutral-700 mb-3" />
              <h3 className="font-medium text-sm sm:text-base mb-2">Telefones</h3>
              <p className="text-neutral-500 text-xs sm:text-sm">
                +55 (11) 3456-7890
                <br />
                +55 (11) 98765-4321
                <br />
                <span className="text-[#25D366] font-medium">WhatsApp</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-neutral-50 p-4 flex flex-col items-center text-center">
              <Mail className="h-6 w-6 text-neutral-700 mb-3" />
              <h3 className="font-medium text-sm sm:text-base mb-2">Email</h3>
              <p className="text-neutral-500 text-xs sm:text-sm">
                contato@restaurante.com
                <br />
                reservas@restaurante.com
                <br />
                &nbsp;
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-neutral-50 p-4 flex flex-col items-center text-center">
              <Clock className="h-6 w-6 text-neutral-700 mb-3" />
              <h3 className="font-medium text-sm sm:text-base mb-2">Horários</h3>
              <p className="text-neutral-500 text-xs sm:text-sm">
                Seg - Qui: 18h - 23h
                <br />
                Sex - Sáb: 18h - 00h
                <br />
                Dom: 12h - 22h
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa e mensagem final */}
      <div className="mt-12 sm:mt-16">
        <div className="relative h-[200px] sm:h-[300px] w-full bg-neutral-100 border border-neutral-200 mb-6 sm:mb-8">
          {/* Aqui poderia ser integrado um mapa real como Google Maps */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-neutral-500 text-xs sm:text-sm">Mapa interativo seria exibido aqui</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-neutral-500 text-xs sm:text-sm max-w-2xl mx-auto mb-6">
            Prefere falar conosco pessoalmente? Visite nosso restaurante ou entre em contato pelos canais acima. Para
            atendimento mais rápido, recomendamos o WhatsApp.
          </p>

          <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button
              className="bg-[#2F5F53] text-white border-2 border-[#2F5F53] hover:bg-white hover:text-[#2F5F53] hover:border-[#2F5F53] transition-all duration-300 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg viewBox="0 0 32 32" className="h-4 w-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C8.28 2 2 8.28 2 16C2 18.9728 2.90933 21.6822 4.42667 23.8683L2.52 29.48L8.32667 27.6133C10.4333 29.0133 13.1067 29.8333 16 29.8333C23.72 29.8333 30 23.5533 30 15.8333C30 12.0733 28.52 8.59333 25.9 5.97333C23.28 3.35333 19.76 2 16 2ZM22.9867 21.0333C22.6667 21.9533 21.2933 22.7333 20.2333 22.9533C19.48 23.1 18.52 23.2133 15.3667 21.9533C11.3667 20.3933 8.8 16.3133 8.56 16C8.33333 15.6867 7 13.8333 7 11.9133C7 10 7.96 9.09333 8.4 8.64C8.76 8.26667 9.33333 8.1 9.88 8.1C10.04 8.1 10.2 8.1 10.3333 8.11333C10.7333 8.13333 10.9333 8.16 11.2 8.76C11.5333 9.52 12.2933 11.4333 12.4 11.6667C12.5133 11.9 12.6267 12.2 12.4667 12.4867C12.32 12.7867 12.1867 12.9333 11.9533 13.2C11.72 13.4667 11.5 13.6667 11.2667 13.96C11.0533 14.2133 10.8133 14.48 11.08 14.9133C11.3467 15.3333 12.1067 16.56 13.2 17.5333C14.6 18.7733 15.7333 19.16 16.2 19.3733C16.5467 19.5333 16.9667 19.5 17.2267 19.2C17.56 18.8267 17.9733 18.1933 18.3933 17.5733C18.6933 17.12 19.0933 17.0533 19.5133 17.2133C19.9467 17.36 21.8533 18.2933 22.32 18.5267C22.7867 18.76 23.0933 18.8733 23.2067 19.0667C23.3067 19.2733 23.3067 20.1 22.9867 21.0333Z" />
              </svg>
              Iniciar conversa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 