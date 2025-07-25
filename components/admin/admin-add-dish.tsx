"use client"

import { useState, useRef } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useToast } from "@/hooks/use-toast"
import { Upload, X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const categories = [
  { id: "tradicional", name: "Tradicional" },
  { id: "fitness", name: "Fitness" },
  { id: "vegetariana", name: "Vegetariana" },
  { id: "Low Carb", name: "Low Carb" },
]

export default function AdminAddDish() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categories: [] as string[],
    ingredients: [] as string[],
    preparationTime: "",
    availableQuantity: "",
    nutritionalInfo: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      fibras: "",
    },
  })
  const [newIngredient, setNewIngredient] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleCategoryChange = (values: string[]) => {
    setFormData((prev) => ({ ...prev, categories: values }))
  }

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()],
      }))
      setNewIngredient("")
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validação de tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Por favor, selecione uma imagem no formato JPG, PNG ou WEBP.",
          variant: "destructive",
        });
        return;
      }

      // Validação de tamanho (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB em bytes
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.categories.length ||
      !formData.ingredients.length ||
      !formData.preparationTime ||
      !formData.availableQuantity
    ) {
      toast({
        title: "Erro ao adicionar prato",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = null;
      if (imageFile) {
        // 1. Upload da imagem para o Firebase Storage
        toast({
          title: "Fazendo upload da imagem...",
          description: "Aguarde enquanto processamos sua imagem.",
        });
        const imageRef = ref(storage, `dishes/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // 2. Gera um id único para o prato
      const generatedId = Date.now().toString();

      // 3. Cria o prato com a URL da imagem (se houver)
      const dishData = {
        id: generatedId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categories: formData.categories,
        ingredients: formData.ingredients,
        preparationTime: parseInt(formData.preparationTime),
        availableQuantity: parseInt(formData.availableQuantity),
        nutritionalInfo: {
          calories: parseInt(formData.nutritionalInfo.calories),
          protein: parseInt(formData.nutritionalInfo.protein),
          carbs: parseInt(formData.nutritionalInfo.carbs),
          fat: parseInt(formData.nutritionalInfo.fat),
          fibras: parseInt(formData.nutritionalInfo.fibras),
        },
        isAvailable: true,
        image: imageUrl || "", // Sempre string
        createdAt: new Date().toISOString(),
      }

      // 4. Salva no Firestore
      await addDoc(collection(db, 'dishes'), dishData);

      toast({
        title: "Prato adicionado com sucesso!",
        description: `${formData.name} foi adicionado ao cardápio.`,
        variant: "success"
      })

      // Limpar o formulário
      setFormData({
        name: "",
        description: "",
        price: "",
        categories: [],
        ingredients: [],
        preparationTime: "",
        availableQuantity: "",
        nutritionalInfo: {
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
          fibras: "",
        },
      })
      setImagePreview(null)
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

    } catch (error) {
      console.error("Erro ao adicionar prato:", error)
      toast({
        title: "Erro ao adicionar prato",
        description: "Ocorreu um erro ao tentar adicionar o prato. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Informações Básicas */}
          <div>
            <Label htmlFor="name">Nome do Prato *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label>Categorias *</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={category.id}
                      checked={formData.categories.includes(category.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            categories: [...prev.categories, category.id]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            categories: prev.categories.filter(c => c !== category.id)
                          }))
                        }
                      }}
                      className="accent-[#DB775F]"
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <Label>Ingredientes *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Digite um ingrediente"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddIngredient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.ingredients.map((ingredient, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Tempo de Preparo */}
          <div>
            <Label htmlFor="preparationTime">Tempo de Preparo (minutos) *</Label>
            <Input
              id="preparationTime"
              name="preparationTime"
              type="number"
              min="0"
              value={formData.preparationTime}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>

          {/* Quantidade Disponível */}
          <div>
            <Label htmlFor="availableQuantity">Quantidade de Marmitas Disponíveis *</Label>
            <Input
              id="availableQuantity"
              name="availableQuantity"
              type="number"
              min="0"
              value={formData.availableQuantity}
              onChange={handleChange}
              className="mt-1"
              placeholder="Ex: 50"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Quando a quantidade chegar a 0, o prato ficará automaticamente indisponível no menu.
            </p>
          </div>

          {/* Informações Nutricionais */}
          <div>
            <Label>Informações Nutricionais *</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-1">
              <div>
                <Label htmlFor="calories" className="text-sm">Calorias (kcal)</Label>
                <Input
                  id="calories"
                  name="nutritionalInfo.calories"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.calories}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-sm">Proteínas (g)</Label>
                <Input
                  id="protein"
                  name="nutritionalInfo.protein"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.protein}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-sm">Carboidratos (g)</Label>
                <Input
                  id="carbs"
                  name="nutritionalInfo.carbs"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.carbs}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-sm">Gorduras (g)</Label>
                <Input
                  id="fat"
                  name="nutritionalInfo.fat"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.fat}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fibras" className="text-sm">Fibras (g)</Label>
                <Input
                  id="fibras"
                  name="nutritionalInfo.fibras"
                  type="number"
                  min="0"
                  value={formData.nutritionalInfo.fibras}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Imagem do Prato *</Label>
            <div
              className="mt-1 border-2 border-dashed border-neutral-300 rounded-sm p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={handleImageClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-48 w-full">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-white rounded-full h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-neutral-400" />
                  <div className="text-sm text-neutral-600">
                    Clique para fazer upload ou arraste uma imagem
                  </div>
                  <div className="text-xs text-neutral-500">
                    PNG, JPG ou WEBP (max. 5MB)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adicionando Prato..." : "Adicionar Prato"}
        </Button>
      </form>
    </div>
  )
}
