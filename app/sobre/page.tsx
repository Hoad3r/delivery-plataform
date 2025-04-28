import Image from "next/image"

export default function SobrePage() {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-24 sm:py-32 max-w-5xl">
      <div className="text-center mb-8 sm:mb-16 pt-8">
        <h1 className="text-2xl sm:text-4xl font-light tracking-tight">Nossa História</h1>
        <div className="w-16 sm:w-20 h-[1px] bg-neutral-300 mx-auto mt-4 sm:mt-6"></div>
      </div>

      {/* História e Visão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center mb-16 sm:mb-24">
        <div className="order-2 md:order-1">
          <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Uma jornada gastronômica</h2>
          <div className="space-y-4 text-sm sm:text-base text-neutral-700">
            <p>
              Fundado em 2010, nosso restaurante nasceu da paixão por unir sabores autênticos e técnicas refinadas. O
              que começou como um pequeno bistrô se transformou em um dos destinos gastronômicos mais respeitados da
              cidade.
            </p>
            <p>
              Nossa cozinha combina tradição e inovação, sempre respeitando a sazonalidade e a origem dos ingredientes.
              Cada prato conta uma história e proporciona uma experiência sensorial única.
            </p>
          </div>
        </div>
        <div className="order-1 md:order-2 relative h-[250px] sm:h-[400px] w-full">
          <Image
            src="/placeholder.svg?height=800&width=600"
            alt="Interior do restaurante"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Filosofia */}
      <div className="bg-neutral-50 py-12 sm:py-16 px-4 sm:px-12 mb-16 sm:mb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-light mb-6 sm:mb-8">Nossa Filosofia</h2>
          <p className="text-sm sm:text-base text-neutral-700 italic">
            "Acreditamos que a verdadeira gastronomia transcende o simples ato de alimentar. É uma expressão artística
            que envolve todos os sentidos, criando memórias que perduram muito além da refeição."
          </p>
          <div className="w-16 h-[1px] bg-neutral-300 mx-auto mt-6 sm:mt-8"></div>
          <p className="text-sm text-neutral-500 mt-4">— Chef Antonio Rossi</p>
        </div>
      </div>

      {/* Chef e Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center mb-16 sm:mb-24">
        <div className="relative h-[250px] sm:h-[400px] w-full">
          <Image src="/placeholder.svg?height=800&width=600" alt="Nosso chef" fill className="object-cover" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Nossa Equipe</h2>
          <div className="space-y-4 text-sm sm:text-base text-neutral-700">
            <p>
              Liderada pelo chef Antonio Rossi, nossa equipe é composta por profissionais apaixonados e talentosos,
              dedicados a oferecer uma experiência gastronômica excepcional.
            </p>
            <p>
              Da cozinha ao salão, cada membro contribui com sua expertise e paixão para criar um ambiente acolhedor e
              uma experiência memorável para nossos clientes.
            </p>
            <p>
              Investimos continuamente no desenvolvimento de nossa equipe, participando de workshops, viagens
              gastronômicas e intercâmbios com outros restaurantes renomados.
            </p>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24">
        <div className="bg-neutral-50 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-light mb-3 sm:mb-4">Qualidade</h3>
          <p className="text-sm text-neutral-700">
            Selecionamos cuidadosamente cada ingrediente, priorizando produtos sazonais, orgânicos e de produtores
            locais. Nossa busca pela excelência se reflete em cada detalhe.
          </p>
        </div>
        <div className="bg-neutral-50 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-light mb-3 sm:mb-4">Criatividade</h3>
          <p className="text-sm text-neutral-700">
            Inovamos constantemente nosso menu, explorando novas técnicas e combinações de sabores, sempre respeitando a
            essência dos ingredientes e as tradições culinárias.
          </p>
        </div>
        <div className="bg-neutral-50 p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-light mb-3 sm:mb-4">Sustentabilidade</h3>
          <p className="text-sm text-neutral-700">
            Comprometemo-nos com práticas sustentáveis, desde a escolha dos fornecedores até a gestão de resíduos,
            buscando minimizar nosso impacto ambiental.
          </p>
        </div>
      </div>

      {/* Compromisso */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Nosso Compromisso</h2>
        <p className="text-sm sm:text-base text-neutral-700 mb-6">
          Seja para um jantar romântico, uma celebração especial ou uma refeição casual, nosso compromisso é
          proporcionar momentos memoráveis através de uma gastronomia de excelência e um atendimento atencioso.
        </p>
        <p className="text-sm sm:text-base text-neutral-700">
          Agradecemos a confiança de nossos clientes e esperamos continuar fazendo parte de suas histórias e momentos
          especiais.
        </p>
      </div>
    </div>
  )
} 