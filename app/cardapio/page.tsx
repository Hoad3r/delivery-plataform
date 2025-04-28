import { Suspense } from "react"
import MenuCategories from "@/components/menu-categories"
import MenuItems from "@/components/menu-items"
import { Skeleton } from "@/components/ui/skeleton"

export default function MenuPage() {
  return (
    <div className="container mx-auto px-6 py-24 max-w-7xl pt-28">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-light tracking-tight">Nosso Cardápio</h1>
        <p className="text-neutral-500 mt-4 max-w-2xl mx-auto">
          Explore nossa seleção de marmitas saudáveis e saborosas. Escolha seus pratos favoritos e nós cuidamos do resto!
        </p>
        <div className="w-20 h-[1px] bg-primary mx-auto mt-6"></div>
      </div>

      <Suspense fallback={<CategoriesSkeleton />}>
        <MenuCategories />
      </Suspense>

      <div className="mt-8">
        <Suspense fallback={<MenuSkeleton />}>
          <MenuItems />
        </Suspense>
      </div>
    </div>
  )
}

function CategoriesSkeleton() {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-light mb-6">Categorias</h2>
      <div className="flex space-x-2 overflow-x-auto py-2">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-12 w-24" />
          ))}
      </div>
    </div>
  )
}

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
    </div>
  )
}

