"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2, AlertTriangle, ArrowUpDown, MoreHorizontal, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Mock data for inventory
const mockIngredients = [
  {
    id: "ING-001",
    name: "Arroz Branco",
    category: "Grãos",
    unit: "kg",
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    lastUpdated: "2023-11-25",
    supplier: "Distribuidora Alimentos SA",
    cost: 5.5,
    status: "ok", // ok, low, critical
  },
  {
    id: "ING-002",
    name: "Feijão Carioca",
    category: "Grãos",
    unit: "kg",
    currentStock: 18,
    minStock: 8,
    maxStock: 30,
    lastUpdated: "2023-11-25",
    supplier: "Distribuidora Alimentos SA",
    cost: 7.8,
    status: "ok",
  },
  {
    id: "ING-003",
    name: "Peito de Frango",
    category: "Proteínas",
    unit: "kg",
    currentStock: 12,
    minStock: 15,
    maxStock: 40,
    lastUpdated: "2023-11-27",
    supplier: "Frigorífico Central",
    cost: 18.9,
    status: "low",
  },
  {
    id: "ING-004",
    name: "Filé Mignon",
    category: "Proteínas",
    unit: "kg",
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    lastUpdated: "2023-11-27",
    supplier: "Frigorífico Central",
    cost: 65.0,
    status: "ok",
  },
  {
    id: "ING-005",
    name: "Tomate",
    category: "Vegetais",
    unit: "kg",
    currentStock: 5,
    minStock: 8,
    maxStock: 25,
    lastUpdated: "2023-11-28",
    supplier: "Hortifruti Express",
    cost: 6.5,
    status: "low",
  },
  {
    id: "ING-006",
    name: "Cebola",
    category: "Vegetais",
    unit: "kg",
    currentStock: 7,
    minStock: 5,
    maxStock: 20,
    lastUpdated: "2023-11-28",
    supplier: "Hortifruti Express",
    cost: 4.2,
    status: "ok",
  },
  {
    id: "ING-007",
    name: "Alface",
    category: "Vegetais",
    unit: "unid",
    currentStock: 10,
    minStock: 10,
    maxStock: 30,
    lastUpdated: "2023-11-28",
    supplier: "Hortifruti Express",
    cost: 2.5,
    status: "ok",
  },
  {
    id: "ING-008",
    name: "Azeite Extra Virgem",
    category: "Condimentos",
    unit: "L",
    currentStock: 3,
    minStock: 5,
    maxStock: 15,
    lastUpdated: "2023-11-20",
    supplier: "Importadora Gourmet",
    cost: 28.9,
    status: "low",
  },
  {
    id: "ING-009",
    name: "Sal",
    category: "Condimentos",
    unit: "kg",
    currentStock: 8,
    minStock: 3,
    maxStock: 10,
    lastUpdated: "2023-11-15",
    supplier: "Distribuidora Alimentos SA",
    cost: 2.2,
    status: "ok",
  },
  {
    id: "ING-010",
    name: "Pimenta do Reino",
    category: "Condimentos",
    unit: "kg",
    currentStock: 0.8,
    minStock: 1,
    maxStock: 3,
    lastUpdated: "2023-11-15",
    supplier: "Importadora Gourmet",
    cost: 45.0,
    status: "critical",
  },
  {
    id: "ING-011",
    name: "Batata",
    category: "Vegetais",
    unit: "kg",
    currentStock: 18,
    minStock: 10,
    maxStock: 30,
    lastUpdated: "2023-11-28",
    supplier: "Hortifruti Express",
    cost: 5.8,
    status: "ok",
  },
  {
    id: "ING-012",
    name: "Cenoura",
    category: "Vegetais",
    unit: "kg",
    currentStock: 12,
    minStock: 8,
    maxStock: 25,
    lastUpdated: "2023-11-28",
    supplier: "Hortifruti Express",
    cost: 4.9,
    status: "ok",
  },
]

// Mock data for suppliers
const mockSuppliers = [
  {
    id: "SUP-001",
    name: "Distribuidora Alimentos SA",
    contact: "Carlos Mendes",
    phone: "(11) 3456-7890",
    email: "contato@distribuidoraalimentos.com",
    address: "Rua dos Alimentos, 123, São Paulo, SP",
    items: ["Arroz Branco", "Feijão Carioca", "Sal"],
  },
  {
    id: "SUP-002",
    name: "Frigorífico Central",
    contact: "Ana Oliveira",
    phone: "(11) 2345-6789",
    email: "pedidos@frigorificocentral.com",
    address: "Av. das Carnes, 500, São Paulo, SP",
    items: ["Peito de Frango", "Filé Mignon"],
  },
  {
    id: "SUP-003",
    name: "Hortifruti Express",
    contact: "Roberto Silva",
    phone: "(11) 9876-5432",
    email: "vendas@hortifrutiexpress.com",
    address: "Rua das Verduras, 78, São Paulo, SP",
    items: ["Tomate", "Cebola", "Alface", "Batata", "Cenoura"],
  },
  {
    id: "SUP-004",
    name: "Importadora Gourmet",
    contact: "Mariana Santos",
    phone: "(11) 8765-4321",
    email: "contato@importadoragourmet.com",
    address: "Av. Gourmet, 300, São Paulo, SP",
    items: ["Azeite Extra Virgem", "Pimenta do Reino"],
  },
]

// Status colors
const statusColors = {
  ok: "bg-green-100 text-green-800",
  low: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
}

// Status labels
const statusLabels = {
  ok: "Adequado",
  low: "Baixo",
  critical: "Crítico",
}

export default function AdminInventory() {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState(mockIngredients)
  const [suppliers, setSuppliers] = useState(mockSuppliers)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [filteredIngredients, setFilteredIngredients] = useState(ingredients)
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    category: "",
    unit: "kg",
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    supplier: "",
    cost: 0,
  })

  // Apply filters
  const applyFilters = () => {
    let filtered = [...ingredients]

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (ingredient) => ingredient.name.toLowerCase().includes(term) || ingredient.id.toLowerCase().includes(term),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((ingredient) => ingredient.category === categoryFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ingredient) => ingredient.status === statusFilter)
    }

    setFilteredIngredients(filtered)
  }

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setTimeout(applyFilters, 300)
  }

  // Handle category filter
  const handleCategoryFilter = (value) => {
    setCategoryFilter(value)
    setTimeout(applyFilters, 300)
  }

  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setTimeout(applyFilters, 300)
  }

  // Get unique categories
  const categories = [...new Set(ingredients.map((item) => item.category))]

  // Handle add ingredient
  const handleAddIngredient = () => {
    // Validate form
    if (!newIngredient.name || !newIngredient.category || !newIngredient.supplier) {
      toast({
        title: "Erro ao adicionar ingrediente",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Create new ingredient
    const newId = `ING-${String(ingredients.length + 1).padStart(3, "0")}`
    const status =
      newIngredient.currentStock < newIngredient.minStock
        ? newIngredient.currentStock <= 0
          ? "critical"
          : "low"
        : "ok"

    const ingredient = {
      ...newIngredient,
      id: newId,
      lastUpdated: new Date().toISOString().split("T")[0],
      status,
    }

    // Add to state
    setIngredients([...ingredients, ingredient])
    setFilteredIngredients([...filteredIngredients, ingredient])

    // Reset form and close dialog
    setNewIngredient({
      name: "",
      category: "",
      unit: "kg",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      supplier: "",
      cost: 0,
    })
    setIsAddIngredientOpen(false)

    toast({
      title: "Ingrediente adicionado",
      description: `${ingredient.name} foi adicionado ao inventário.`,
    })
  }

  // Calculate inventory stats
  const totalItems = ingredients.length
  const lowStockItems = ingredients.filter((item) => item.status === "low").length
  const criticalItems = ingredients.filter((item) => item.status === "critical").length
  const totalValue = ingredients.reduce((sum, item) => sum + item.currentStock * item.cost, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <FileText className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-neutral-500 pt-1">Itens no inventário</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens com Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <div className="text-xs text-neutral-500 pt-1">Itens abaixo do estoque mínimo</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalItems}</div>
            <div className="text-xs text-neutral-500 pt-1">Itens com estoque crítico ou zerado</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            <FileText className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
            <div className="text-xs text-neutral-500 pt-1">Baseado no custo atual</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 h-auto">
          <TabsTrigger value="inventory" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Inventário
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs md:text-sm py-2 px-1 md:py-3 md:px-4">
            Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Buscar ingrediente..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 rounded-none"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ok">Adequado</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-none">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Ingrediente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Ingrediente</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do novo ingrediente para adicionar ao inventário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Nome do Ingrediente *
                        </label>
                        <Input
                          id="name"
                          value={newIngredient.name}
                          onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                          className="mt-1 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="text-sm font-medium">
                          Categoria *
                        </label>
                        <Select
                          value={newIngredient.category}
                          onValueChange={(value) => setNewIngredient({ ...newIngredient, category: value })}
                        >
                          <SelectTrigger id="category" className="mt-1 rounded-none">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="Novo">Nova Categoria</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor="unit" className="text-sm font-medium">
                          Unidade *
                        </label>
                        <Select
                          value={newIngredient.unit}
                          onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                        >
                          <SelectTrigger id="unit" className="mt-1 rounded-none">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Quilograma (kg)</SelectItem>
                            <SelectItem value="g">Grama (g)</SelectItem>
                            <SelectItem value="L">Litro (L)</SelectItem>
                            <SelectItem value="ml">Mililitro (ml)</SelectItem>
                            <SelectItem value="unid">Unidade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="currentStock" className="text-sm font-medium">
                          Estoque Atual *
                        </label>
                        <Input
                          id="currentStock"
                          type="number"
                          value={newIngredient.currentStock}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, currentStock: Number.parseFloat(e.target.value) })
                          }
                          className="mt-1 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="minStock" className="text-sm font-medium">
                          Estoque Mínimo *
                        </label>
                        <Input
                          id="minStock"
                          type="number"
                          value={newIngredient.minStock}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, minStock: Number.parseFloat(e.target.value) })
                          }
                          className="mt-1 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="maxStock" className="text-sm font-medium">
                          Estoque Máximo *
                        </label>
                        <Input
                          id="maxStock"
                          type="number"
                          value={newIngredient.maxStock}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, maxStock: Number.parseFloat(e.target.value) })
                          }
                          className="mt-1 rounded-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="supplier" className="text-sm font-medium">
                          Fornecedor *
                        </label>
                        <Select
                          value={newIngredient.supplier}
                          onValueChange={(value) => setNewIngredient({ ...newIngredient, supplier: value })}
                        >
                          <SelectTrigger id="supplier" className="mt-1 rounded-none">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.name}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor="cost" className="text-sm font-medium">
                          Custo (R$) *
                        </label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={newIngredient.cost}
                          onChange={(e) =>
                            setNewIngredient({ ...newIngredient, cost: Number.parseFloat(e.target.value) })
                          }
                          className="mt-1 rounded-none"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddIngredientOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddIngredient}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Inventário de Ingredientes</CardTitle>
              <CardDescription>{filteredIngredients.length} ingredientes encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">ID</th>
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Categoria</th>
                      <th className="text-left py-3 px-4 font-medium">Estoque</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Fornecedor</th>
                      <th className="text-left py-3 px-4 font-medium">Custo</th>
                      <th className="text-center py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIngredients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-neutral-500">
                          Nenhum ingrediente encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredIngredients.map((ingredient) => (
                        <tr key={ingredient.id} className="border-b hover:bg-neutral-50">
                          <td className="py-3 px-4 font-medium">{ingredient.id}</td>
                          <td className="py-3 px-4">{ingredient.name}</td>
                          <td className="py-3 px-4">{ingredient.category}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span>
                                {ingredient.currentStock} {ingredient.unit}
                              </span>
                              <div className="w-20 bg-neutral-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    ingredient.status === "critical"
                                      ? "bg-red-500"
                                      : ingredient.status === "low"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                  }`}
                                  style={{ width: `${(ingredient.currentStock / ingredient.maxStock) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-neutral-500">
                              Min: {ingredient.minStock} | Max: {ingredient.maxStock}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${statusColors[ingredient.status]} font-normal`}>
                              {statusLabels[ingredient.status]}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{ingredient.supplier}</td>
                          <td className="py-3 px-4">
                            R$ {ingredient.cost.toFixed(2)}/{ingredient.unit}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ArrowUpDown className="h-4 w-4 mr-2" /> Ajustar Estoque
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="flex justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input placeholder="Buscar fornecedor..." className="pl-10 rounded-none" />
              </div>
            </div>
            <Button className="rounded-none">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Fornecedor
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{supplier.name}</CardTitle>
                      <CardDescription>{supplier.id}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-neutral-500">Contato</div>
                      <div>{supplier.contact}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-neutral-500">Telefone</div>
                        <div>{supplier.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500">Email</div>
                        <div className="truncate">{supplier.email}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Endereço</div>
                      <div className="text-sm">{supplier.address}</div>
                    </div>
                    <div>
                      <div className="text-sm text-neutral-500">Produtos Fornecidos</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {supplier.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

