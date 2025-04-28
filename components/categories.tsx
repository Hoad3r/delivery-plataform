import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  {
    id: "all",
    name: "Todas",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "tradicional",
    name: "Tradicionais",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "fitness",
    name: "Fitness",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "vegetariana",
    name: "Vegetarianas",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: "lowcarb",
    name: "Low Carb",
    image: "/placeholder.svg?height=200&width=200",
  },
]

export default function Categories() {
  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold mb-8">Categorias</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/cardapio?categoria=${category.id}`}>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-0">
                <div className="relative h-32 w-full">
                  <Image src={category.image || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium">{category.name}</h3>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

