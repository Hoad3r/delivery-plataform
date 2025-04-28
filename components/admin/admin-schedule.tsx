"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Mock data - em um app real, isso viria do banco de dados
const initialDishes = [
  {
    id: "1",
    name: "Risoto de Funghi",
    category: "principais",
    selected: false,
  },
  {
    id: "2",
    name: "Filé ao Molho de Vinho Tinto",
    category: "carnes",
    selected: false,
  },
  {
    id: "3",
    name: "Ravióli de Abóbora",
    category: "massas",
    selected: false,
  },
  {
    id: "4",
    name: "Carpaccio de Wagyu",
    category: "entradas",
    selected: false,
  },
  {
    id: "5",
    name: "Tiramisù",
    category: "sobremesas",
    selected: false,
  },
]

export default function AdminSchedule() {
  const { toast } = useToast()
  const [date, setDate] = useState(new Date())
  const [dishes, setDishes] = useState(initialDishes)
  const [disabledDates, setDisabledDates] = useState({})

  const handleDishToggle = (id) => {
    setDishes(dishes.map((dish) => (dish.id === id ? { ...dish, selected: !dish.selected } : dish)))
  }

  const handleSelectAll = (value) => {
    setDishes(dishes.map((dish) => ({ ...dish, selected: value })))
  }

  const handleSaveSchedule = () => {
    const selectedDishes = dishes.filter((dish) => dish.selected)
    const formattedDate = date.toISOString().split("T")[0]

    // Em um app real, você enviaria isso para o backend
    console.log("Data:", formattedDate)
    console.log("Pratos desativados:", selectedDishes)

    // Atualizar o estado local para mostrar as datas com pratos desativados
    setDisabledDates((prev) => ({
      ...prev,
      [formattedDate]: selectedDishes.map((dish) => dish.id),
    }))

    toast({
      title: "Programação salva",
      description: `${selectedDishes.length} pratos foram desativados para ${date.toLocaleDateString()}.`,
    })

    // Resetar seleções
    setDishes(dishes.map((dish) => ({ ...dish, selected: false })))
  }

  // Verificar se a data selecionada tem pratos desativados
  const selectedDateKey = date ? date.toISOString().split("T")[0] : null
  const hasDisabledDishes = selectedDateKey && disabledDates[selectedDateKey]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-light mb-4">Selecione uma data</h3>
        <Calendar mode="single" selected={date} onSelect={setDate} className="border rounded-md p-3" />

        {hasDisabledDishes && (
          <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200">
            <h4 className="font-medium text-sm mb-2">Pratos desativados nesta data:</h4>
            <ul className="text-sm text-neutral-600 space-y-1">
              {disabledDates[selectedDateKey].map((dishId) => {
                const dish = dishes.find((d) => d.id === dishId)
                return dish ? <li key={dish.id}>• {dish.name}</li> : null
              })}
            </ul>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-light">
            Desativar pratos para {date ? date.toLocaleDateString() : "a data selecionada"}
          </h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={dishes.every((dish) => dish.selected)}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm">
              Selecionar todos
            </Label>
          </div>
        </div>

        <div className="border border-neutral-200 rounded-md divide-y">
          {dishes.map((dish) => (
            <div key={dish.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`dish-${dish.id}`}
                  checked={dish.selected}
                  onCheckedChange={() => handleDishToggle(dish.id)}
                />
                <Label htmlFor={`dish-${dish.id}`} className="font-light">
                  {dish.name}
                </Label>
              </div>
              <span className="text-xs text-neutral-500">{dish.category}</span>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSaveSchedule} className="rounded-none bg-black text-white hover:bg-neutral-800">
            Salvar Programação
          </Button>
          <p className="text-xs text-neutral-500 mt-2">
            Os pratos selecionados não aparecerão no cardápio na data escolhida.
          </p>
        </div>
      </div>
    </div>
  )
}

