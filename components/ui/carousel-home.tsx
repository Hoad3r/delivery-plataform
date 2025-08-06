"use client"

import { useEffect, useState } from "react"
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Image from 'next/image'

export default function CarouselHome() {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true)
      const q = query(collection(db, 'carouselImages'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      setImages(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }
    fetchImages()
  }, [])

  if (loading) {
    return <div className="w-full flex justify-center py-12">Carregando imagens...</div>
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-[#f4f1ea] py-8">
      <div className="max-w-6xl mx-auto px-2 sm:px-6 md:px-8">
        <Carousel opts={{ loop: true }}>
          <CarouselContent>
            {images.map(img => (
              <CarouselItem key={img.id}>
                <div className="relative w-full h-[320px] sm:h-[420px] md:h-[520px]">
                  <Image
                    src={img.url}
                    alt="Carrossel"
                    fill
                    className="object-contain w-full h-full"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                    priority
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-white/80 hover:bg-white text-[#2F5F53] border-[#2F5F53] hover:text-white hover:bg-[#2F5F53]" />
          <CarouselNext className="bg-white/80 hover:bg-white text-[#2F5F53] border-[#2F5F53] hover:text-white hover:bg-[#2F5F53]" />
        </Carousel>
      </div>
    </div>
  )
}