import { Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    quote:
      "Uma experiência gastronômica inesquecível. Cada prato é uma obra de arte, com sabores perfeitamente equilibrados.",
    author: "Maria Silva",
    title: "Cliente frequente",
  },
  {
    id: 2,
    quote:
      "O ambiente elegante e o atendimento impecável complementam perfeitamente a culinária refinada. Um verdadeiro tesouro gastronômico.",
    author: "Carlos Mendes",
    title: "Crítico gastronômico",
  },
  {
    id: 3,
    quote:
      "Desde a entrada até a sobremesa, cada detalhe é cuidadosamente pensado. Uma experiência que transcende o simples ato de comer.",
    author: "Ana Oliveira",
    title: "Chef convidada",
  },
]

export default function Testimonials() {
  return (
    <div className="grid grid-cols-1 gap-8">
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="bg-neutral-800 p-8 relative">
          <Quote className="absolute top-6 left-6 text-neutral-700 h-12 w-12 opacity-50" />
          <div className="relative z-10">
            <p className="italic text-lg font-light mb-6 text-neutral-200">"{testimonial.quote}"</p>
            <div>
              <p className="font-medium text-white">{testimonial.author}</p>
              <p className="text-neutral-400 text-sm">{testimonial.title}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

