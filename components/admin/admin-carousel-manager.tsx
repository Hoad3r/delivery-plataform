"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Trash2 } from "lucide-react"
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default function AdminCarouselManager() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [carouselImages, setCarouselImages] = useState<Array<{
    id: string;
    url: string;
    storagePath: string;
    createdAt: string;
  }>>([])
  const [loadingImages, setLoadingImages] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setLoadingImages(true)
    const querySnapshot = await getDocs(collection(db, 'carouselImages'))
    const images = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Array<{
      id: string;
      url: string;
      storagePath: string;
      createdAt: string;
    }>
    setCarouselImages(images)
    setLoadingImages(false)
  }

  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Por favor, selecione uma imagem no formato JPG, PNG ou WEBP.",
          variant: "destructive",
        });
        return;
      }
      const maxSize = 5 * 1024 * 1024;
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

  const removeImagePreview = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      toast({
        title: "Selecione uma imagem",
        description: "Por favor, selecione uma imagem para o carrossel.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      toast({
        title: "Fazendo upload da imagem...",
        description: "Aguarde enquanto processamos sua imagem.",
      });
      const imageRef = ref(storage, `carousel/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);
      await addDoc(collection(db, 'carouselImages'), {
        url: imageUrl,
        storagePath: imageRef.fullPath,
        createdAt: new Date().toISOString(),
      })
      toast({
        title: "Imagem adicionada ao carrossel!",
        variant: "success"
      })
      setImagePreview(null)
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchImages()
    } catch (error) {
      console.error("Erro ao adicionar imagem ao carrossel:", error)
      toast({
        title: "Erro ao adicionar imagem",
        description: "Ocorreu um erro ao tentar adicionar a imagem. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveCarouselImage = async (img: {
    id: string;
    url: string;
    storagePath: string;
    createdAt: string;
  }) => {
    if (!img.id || !img.storagePath) return
    try {
      await deleteDoc(doc(db, 'carouselImages', img.id))
      await deleteObject(ref(storage, img.storagePath))
      toast({
        title: "Imagem removida do carrossel!",
        variant: "success"
      })
      fetchImages()
    } catch (error) {
      console.error("Erro ao remover imagem do carrossel:", error)
      toast({
        title: "Erro ao remover imagem",
        description: "Ocorreu um erro ao tentar remover a imagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md border border-neutral-200">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-[#2F5F53]">Gerenciar Carrossel de Imagens</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="mb-2 font-medium">Adicionar nova imagem ao carrossel</div>
          <div
            className="border-2 border-dashed border-neutral-300 rounded-sm p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
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
                  onClick={e => { e.stopPropagation(); removeImagePreview() }}
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Adicionando Imagem..." : "Adicionar Imagem ao Carrossel"}
        </Button>
      </form>
      <div className="mt-10">
        <div className="mb-2 font-medium">Imagens atuais do carrossel</div>
        {loadingImages ? (
          <div>Carregando imagens...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {carouselImages.length === 0 && <div className="col-span-2 text-neutral-500">Nenhuma imagem cadastrada.</div>}
            {carouselImages.map(img => (
              <div key={img.id} className="relative border rounded overflow-hidden group">
                <Image src={img.url} alt="Carrossel" width={300} height={180} className="object-cover w-full h-32" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-80 group-hover:opacity-100"
                  onClick={() => handleRemoveCarouselImage(img)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}