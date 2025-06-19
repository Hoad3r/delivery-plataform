"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Edit, MoreHorizontal, Trash2, EyeOff, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMenu } from "@/contexts/menu-context"
import { formatCurrency } from "@/lib/utils"
import { Dish } from "@/types/menu"
import { collection, getDocs, onSnapshot, QuerySnapshot, DocumentData, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { ref as storageRef, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"

export default function AdminDishList() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dishToDelete, setDishToDelete] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Dish> | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const { toast } = useToast()

  // Buscar pratos do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "dishes"), (snapshot: QuerySnapshot<DocumentData>) => {
      const pratos: Dish[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id }))
      setDishes(pratos)
    })
    return () => unsubscribe()
  }, [])

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = showInactive ? true : dish.isAvailable
    return matchesSearch && matchesStatus
  })

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Buscar o documento pelo campo id
      const snapshot = await getDocs(collection(db, "dishes"));
      const dishDoc = snapshot.docs.find(docSnap => docSnap.data().id === id);
      if (dishDoc) {
        await updateDoc(doc(db, "dishes", dishDoc.id), {
          isAvailable: !currentStatus
        });
        toast({
          title: !currentStatus ? "Prato ativado" : "Prato desativado",
          description: !currentStatus ? "O prato foi ativado com sucesso." : "O prato foi desativado com sucesso.",
          variant: !currentStatus ? "success" : "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade do prato:", error);
    }
  }

  const handleDeleteDish = async () => {
    try {
      const snapshot = await getDocs(collection(db, "dishes"));
      const dishDoc = snapshot.docs.find(docSnap => docSnap.data().id === dishToDelete);
      if (dishDoc) {
        const dishData = dishDoc.data();
        // Exclui a imagem do Storage, se existir
        if (dishData.image) {
          // Extrai o caminho do arquivo a partir da URL
          const match = decodeURIComponent(dishData.image).match(/\/o\/(.*)\?alt=media/);
          const filePath = match ? match[1] : null;
          if (filePath) {
            const imageRef = storageRef(storage, filePath);
            await deleteObject(imageRef);
          }
        }
        // Exclui o documento do prato
        await deleteDoc(doc(db, "dishes", dishDoc.id));
        toast({
          title: "Prato removido",
          description: "O prato e sua imagem foram removidos com sucesso.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao remover prato:", error)
    }
    setIsDeleteDialogOpen(false)
    setDishToDelete(null)
  }

  // Função para abrir modal de edição com dados do prato
  const openEditModal = (dish: Dish) => {
    setEditingDish(dish)
    setEditForm({ ...dish })
  }

  // Função para salvar edição
  const handleEditSave = async () => {
    if (!editForm || !editForm.id) return
    setIsSavingEdit(true)
    try {
      // Buscar o documento pelo campo id
      const snapshot = await getDocs(collection(db, "dishes"));
      const dishDoc = snapshot.docs.find(docSnap => docSnap.data().id === editForm.id);
      if (dishDoc) {
        await updateDoc(doc(db, "dishes", dishDoc.id), {
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          category: editForm.category,
          ingredients: editForm.ingredients,
          preparationTime: editForm.preparationTime,
          nutritionalInfo: editForm.nutritionalInfo,
        });
        toast({
          title: "Prato editado",
          description: "As alterações foram salvas com sucesso.",
          variant: "success"
        })
      }
      setEditingDish(null)
      setEditForm(null)
    } catch (error) {
      console.error("Erro ao editar prato:", error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <Input
          placeholder="Buscar pratos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md rounded-none"
        />
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-inactive" 
            checked={showInactive} 
            onCheckedChange={(checked) => setShowInactive(checked === true)} 
          />
          <label htmlFor="show-inactive" className="text-xs md:text-sm text-neutral-600">
            Mostrar pratos inativos
          </label>
        </div>
      </div>

      <div className="border border-neutral-200">
        <div className="grid grid-cols-12 bg-neutral-50 p-4 border-b border-neutral-200 hidden md:grid">
          <div className="col-span-1 font-light text-neutral-500">Imagem</div>
          <div className="col-span-3 font-light text-neutral-500">Nome</div>
          <div className="col-span-3 font-light text-neutral-500">Descrição</div>
          <div className="col-span-1 font-light text-neutral-500">Preço</div>
          <div className="col-span-2 font-light text-neutral-500">Status</div>
          <div className="col-span-2 font-light text-neutral-500 text-right">Ações</div>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">Nenhum prato encontrado.</div>
        ) : (
          filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className={`grid grid-cols-1 md:grid-cols-12 p-4 border-b border-neutral-200 gap-4 md:gap-0 ${!dish.isAvailable ? "bg-neutral-50" : ""}`}
            >
              {/* Mobile view */}
              <div className="flex flex-col md:hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image src={dish.image || "/placeholder.svg"} alt={dish.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{dish.name}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2">{dish.description}</p>
                      <p className="text-xs mt-1">{formatCurrency(dish.price)}</p>
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${dish.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {dish.isAvailable ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(dish)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(dish.id, dish.isAvailable)}>
                        {dish.isAvailable ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDishToDelete(dish.id)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Desktop view */}
              <div className="col-span-1 hidden md:block">
                <div className="relative w-12 h-12">
                  <Image src={dish.image || "/placeholder.svg"} alt={dish.name} fill className="object-cover" />
                </div>
              </div>
              <div className="col-span-3 hidden md:block">{dish.name}</div>
              <div className="col-span-3 hidden md:block text-sm text-neutral-600 line-clamp-2">{dish.description}</div>
              <div className="col-span-1 hidden md:block">{formatCurrency(dish.price)}</div>
              <div className="col-span-2 hidden md:flex items-center">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${dish.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {dish.isAvailable ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="col-span-2 hidden md:flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(dish)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleActive(dish.id, dish.isAvailable)}>
                  {dish.isAvailable ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" /> Desativar
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" /> Ativar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setDishToDelete(dish.id)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este prato? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteDish}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dish Dialog - Simplificado para este exemplo */}
      {editingDish && (
        <Dialog open={!!editingDish} onOpenChange={() => { setEditingDish(null); setEditForm(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Prato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <label className="block text-sm">Nome</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={editForm?.name || ""}
                onChange={e => setEditForm(f => ({ ...f!, name: e.target.value }))}
              />
              <label className="block text-sm">Descrição</label>
              <textarea
                className="w-full border rounded px-2 py-1"
                value={editForm?.description || ""}
                onChange={e => setEditForm(f => ({ ...f!, description: e.target.value }))}
              />
              <label className="block text-sm">Preço</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={editForm?.price || ""}
                onChange={e => setEditForm(f => ({ ...f!, price: Number(e.target.value) }))}
              />
              <label className="block text-sm">Categoria</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={editForm?.category || ""}
                onChange={e => setEditForm(f => ({ ...f!, category: e.target.value }))}
              />
              <label className="block text-sm">Ingredientes (separados por vírgula)</label>
              <input
                className="w-full border rounded px-2 py-1"
                value={editForm?.ingredients?.join(", ") || ""}
                onChange={e => setEditForm(f => ({ ...f!, ingredients: e.target.value.split(",").map(i => i.trim()) }))}
              />
              <label className="block text-sm">Tempo de preparo (min)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={editForm?.preparationTime || ""}
                onChange={e => setEditForm(f => ({ ...f!, preparationTime: Number(e.target.value) }))}
              />
              <label className="block text-sm">Informações Nutricionais (calorias, proteína, carboidratos, gordura)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Calorias"
                  className="border rounded px-2 py-1"
                  value={editForm?.nutritionalInfo?.calories || ""}
                  onChange={e => setEditForm(f => ({ ...f!, nutritionalInfo: { ...f!.nutritionalInfo, calories: Number(e.target.value) } }))}
                />
                <input
                  type="number"
                  placeholder="Proteína"
                  className="border rounded px-2 py-1"
                  value={editForm?.nutritionalInfo?.protein || ""}
                  onChange={e => setEditForm(f => ({ ...f!, nutritionalInfo: { ...f!.nutritionalInfo, protein: Number(e.target.value) } }))}
                />
                <input
                  type="number"
                  placeholder="Carboidratos"
                  className="border rounded px-2 py-1"
                  value={editForm?.nutritionalInfo?.carbs || ""}
                  onChange={e => setEditForm(f => ({ ...f!, nutritionalInfo: { ...f!.nutritionalInfo, carbs: Number(e.target.value) } }))}
                />
                <input
                  type="number"
                  placeholder="Gordura"
                  className="border rounded px-2 py-1"
                  value={editForm?.nutritionalInfo?.fat || ""}
                  onChange={e => setEditForm(f => ({ ...f!, nutritionalInfo: { ...f!.nutritionalInfo, fat: Number(e.target.value) } }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => { setEditingDish(null); setEditForm(null); }} variant="outline">Cancelar</Button>
              <Button onClick={handleEditSave} disabled={isSavingEdit}>
                {isSavingEdit ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

