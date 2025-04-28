"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"

const categories = [
  { id: "entradas", name: "Entradas" },
  { id: "principais", name: "Pratos Principais" },
  { id: "peixes", name: "Peixes e Frutos do Mar" },
  { id: "carnes", name: "Carnes" },
  { id: "massas", name: "Massas" },
  { id: "sobremesas", name: "Sobremesas" },
  { id: "vinhos", name: "Carta de Vinhos" },
]

export default function AdminAddDish() {
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleImageClick = () => {
    fileInputRef.current.click()
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
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

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validação básica
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Erro ao adicionar prato",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (!imageFile) {
      toast({
        title: "Erro ao adicionar prato",
        description: "Por favor, selecione uma imagem para o prato.",
        variant: "destructive",
      })
      return
    }

    // Aqui você enviaria os dados para o backend
    // Incluindo o upload da imagem
    console.log("Dados do novo prato:", formData)
    console.log("Imagem:", imageFile)

    toast({
      title: "Prato adicionado com sucesso!",
      description: `${formData.name} foi adicionado ao cardápio.`,
    })

    // Limpar o formulário
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
    })
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Prato *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="rounded-none mt-1"
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
              className="rounded-none mt-1 min-h-[100px]"
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
                className="rounded-none mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange} required>
                <SelectTrigger id="category" className="rounded-none mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Imagem do Prato *</Label>
            <div
              className="mt-1 border-2 border-dashed border-neutral-300 rounded-sm p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={handleImageClick}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-48 w-full">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
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
                <div className="py-8">
                  <Upload className="h-10 w-10 mx-auto text-neutral-400" />
                  <p className="mt-2 text-sm text-neutral-500">Clique para selecionar uma imagem</p>
                  <p className="text-xs text-neutral-400 mt-1">JPG, PNG ou GIF até 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="rounded-none bg-black text-white hover:bg-neutral-800">
            Adicionar Prato
          </Button>
        </div>
      </form>
    </div>
  )
}

