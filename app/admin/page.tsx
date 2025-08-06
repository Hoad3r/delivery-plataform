"use client"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import AdminDishList from "@/components/admin/admin-dish-list"
import AdminAddDish from "@/components/admin/admin-add-dish"
import AdminDashboard from "@/components/admin/admin-dashboard"
import AdminOrders from "@/components/admin/admin-orders"
import CuponsAdminPage from "./cupons/page";
import AdminCarouselManager from "@/components/admin/admin-carousel-manager"

export default function AdminPage() {
  const { logout } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-light">Administração</h1>
          <p className="text-neutral-500 mt-2 text-sm md:text-base">Gerencie o cardápio e os pedidos do restaurante</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="rounded-none border-black text-black hover:bg-black hover:text-white text-xs md:text-sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="rounded-none border-black text-black hover:bg-black hover:text-white text-xs md:text-sm"
            >
              Voltar para o site
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-6 mb-6 md:mb-8 h-auto">
          <TabsTrigger value="dashboard" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="dishes" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Pratos
          </TabsTrigger>
          <TabsTrigger value="add" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Adicionar Prato
          </TabsTrigger>
          <TabsTrigger value="cupons" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Cupons
          </TabsTrigger>
          <TabsTrigger value="carrossel" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Carrossel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrders />
        </TabsContent>

        <TabsContent value="dishes">
          <AdminDishList />
        </TabsContent>

        <TabsContent value="add">
          <AdminAddDish />
        </TabsContent>

        <TabsContent value="cupons">
          <CuponsAdminPage />
        </TabsContent>

        <TabsContent value="carrossel">
          <div className="pt-2">
            <AdminCarouselManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
