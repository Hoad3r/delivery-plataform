import { Suspense } from "react"
import MenuSearch from "@/components/menu-categories"
import MenuItems from "@/components/menu-items"
import { Skeleton } from "@/components/ui/skeleton"

export default function MenuPage() {
  return (
    <div className="container mx-auto px-4 pt-8">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-medium tracking-tight text-[#DB775F]">Nosso Cardápio</h1>
        <p className="text-neutral-500 mt-1 max-w-2xl mx-auto text-sm">
          Explore nossa seleção de marmitas saudáveis e saborosas
        </p>
      </div>

      <Suspense fallback={<SearchSkeleton />}>
        <MenuSearch />
      </Suspense>

      <div>
        <Suspense fallback={<MenuSkeleton />}>
          <MenuItems />
        </Suspense>
      </div>
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton className="h-12 w-full" />
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

