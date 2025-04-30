"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useRef } from "react"

const categories = [
  { id: "all", name: "Todas" },
  { id: "tradicional", name: "Tradicionais" },
  { id: "fitness", name: "Fitness" },
  { id: "vegetariana", name: "Vegetarianas" },
  { id: "lowcarb", name: "Low Carb" },
]

export default function MenuCategories() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get("categoria") || "all"
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categoryId === "all") {
      params.delete("categoria")
    } else {
      params.set("categoria", categoryId)
    }

    router.push(`/cardapio?${params.toString()}`)
  }

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set("busca", term)
    } else {
      params.delete("busca")
    }
    router.push(`/cardapio?${params.toString()}`)
  }

  return (
    <div className="mb-12">
      {/* Layout Mobile - Apenas Busca */}
      <div className="md:hidden">
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Buscar marmitas..."
            className="pl-10 py-6 text-base bg-white border-[#DB775F]/20 focus-visible:ring-[#DB775F]"
            defaultValue={searchParams.get("busca") || ""}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#DB775F]" />
        </div>
      </div>

      {/* Layout Desktop - Botões de Categoria */}
      <div className="hidden md:block relative">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-medium text-[#DB775F]">Categorias</h2>
          <div className="w-20 h-[1px] bg-[#DB775F]/20"></div>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide py-2 px-1 -mx-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex space-x-3 min-w-max">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-medium ${
                    currentCategory === category.id
                      ? "bg-[#DB775F] text-white shadow-lg shadow-[#DB775F]/20"
                      : "bg-white text-[#DB775F] hover:bg-[#DB775F]/5 border border-[#DB775F]/20"
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {category.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

