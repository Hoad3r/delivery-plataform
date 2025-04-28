"use client"
import { useRouter, useSearchParams } from "next/navigation"
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

  return (
    <div className="mb-12 relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">Categorias</h2>
        <div className="w-20 h-[1px] bg-primary/20"></div>
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
                className={`px-6 py-3 rounded-full whitespace-nowrap transition-all ${
                  currentCategory === category.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200"
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
  )
}

