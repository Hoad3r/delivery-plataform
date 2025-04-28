import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

const popularItems = [
  {
    id: 1,
    name: "Marmita Tradicional P",
    description: "Arroz, feijão, filé de frango grelhado, salada de legumes e farofa",
    price: 16.9,
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 2,
    name: "Marmita Fitness",
    description: "Arroz integral, peito de frango grelhado, brócolis, cenoura e batata doce",
    price: 20.9,
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 3,
    name: "Marmita Vegetariana",
    description: "Arroz integral, lentilha, legumes salteados, tofu grelhado e mix de folhas",
    price: 20.9,
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 4,
    name: "Marmita Executiva",
    description: "Arroz, feijão, filé mignon, batata rústica, farofa e salada especial",
    price: 24.9,
    image: "/placeholder.svg?height=300&width=300",
  },
]

export default function PopularItems() {
  return (
    <section id="promocoes" className="py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Mais Populares</h2>
        <Link href="/cardapio" className="flex items-center text-primary">
          Ver todos <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {popularItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative h-48">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{item.description}</p>
              <div className="font-bold text-lg">R$ {item.price.toFixed(2)}</div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button className="w-full">Adicionar ao Carrinho</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}

