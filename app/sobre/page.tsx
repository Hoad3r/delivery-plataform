import Image from "next/image"
// import Footer from "@/components/footer"

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
          <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Uma ideia que nasceu com propósito
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-neutral-700">
            <p>
            A Nossa Cozinha – Marmita Saudável nasceu em 2025, da vontade de cuidar das pessoas através da alimentação. Em um mundo cada vez mais corrido, percebemos o quanto é difícil manter uma rotina equilibrada e ao mesmo tempo saborosa.
            </p>
            <p>
            A chef Adriana Miranda, com sua experiência na gastronomia e sua paixão por nutrir com afeto, decidiu transformar essa necessidade em um projeto com propósito: oferecer refeições saudáveis, práticas e cheias de sabor, que facilitem o dia a dia de quem quer se cuidar.
            </p>
            <p>
            Mais do que entregar marmitas, a Nossa Cozinha quer estar presente na rotina com comida de verdade, feita com carinho, ingredientes selecionados e atenção aos detalhes. Um trabalho movido por afeto, técnica e o desejo genuíno de alimentar bem.
            </p>
            
          </div>
        </div>
        <div className="order-1 md:order-2 relative h-[250px] sm:h-[400px] w-full">
          <Image
            src="/images/banner.jpg"
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
            "Acreditamos que se alimentar bem é um ato de cuidado — consigo mesmo, com o tempo e com a saúde. Por isso, desenvolvemos um modelo que alia sabor, nutrição e praticidade, com marmitas congeladas preparadas com afeto, ingredientes de verdade e equilíbrio."
          </p>
          <div className="w-16 h-[1px] bg-neutral-300 mx-auto mt-6 sm:mt-8"></div>
          <p className="text-sm text-neutral-500 mt-4">— Chef Adriana Miranda</p>
        </div>
      </div>

      {/* Chef e Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center mb-16 sm:mb-24">
        <div className="relative aspect-[3/4] w-full max-w-xs mx-auto sm:max-w-none sm:aspect-[3/4] sm:h-[400px]">
          <Image
            src="/images/adriana.jpg"
            alt="Nossa equipe"
            fill
            className="object-contain rounded shadow"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-light mb-4 sm:mb-6">Quem está por trás da Nossa Cozinha</h2>
          <div className="space-y-4 text-sm sm:text-base text-neutral-700">
            <p>
            A Nossa Cozinha – Marmita Saudável é conduzida pela chef Adriana Miranda, profissional apaixonada pela boa comida, pelo cuidado com as pessoas e pela vontade de transformar o cotidiano através da alimentação.
            </p>
            <p>
            Chef Adriana Miranda
            Consultora de gastronomia com ampla experiência no setor de alimentação, Adriana é especialista em gestão de negócios e liderança de equipes de alta performance. 
            </p>
            <p>
            Traz para o projeto um olhar técnico e estratégico, sempre focado em inovação, organização e excelência nos processos. Sua missão é oferecer refeições que cuidam do corpo e acolhem com sabor e equilíbrio.
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
        Nosso compromisso é oferecer refeições saudáveis, saborosas e feitas com afeto, que respeitem o seu tempo e a sua saúde.
        </p>
        <p className="text-sm sm:text-base text-neutral-700 mb-6">
        Cada marmita é pensada com responsabilidade e carinho, desde a escolha dos ingredientes até a entrega. Queremos estar presentes na sua rotina de forma leve, prática e nutritiva.

        </p>
        <p className="text-sm sm:text-base text-neutral-700">
        Agradecemos a confiança de cada cliente e seguimos com o propósito de alimentar bem — com verdade, equilíbrio e propósito.
        </p>


      </div>
    </div>
  )
} 
