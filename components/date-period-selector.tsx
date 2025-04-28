"use client"

import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useMenu } from "@/contexts/menu-context"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DatePeriodSelector() {
  const { selectedDate, selectedPeriod, setSelectedDate, setSelectedPeriod } = useMenu()

  // Validar se a data selecionada é válida
  const isDateValid = selectedDate && new Date(selectedDate) >= new Date(new Date().setHours(0, 0, 0, 0))

  // Calcular a data máxima (7 dias à frente)
  const maxDate = addDays(new Date(), 7)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Selecione a Data de Recebimento
        </h3>
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => date && setSelectedDate(format(date, "yyyy-MM-dd"))}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date > maxDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Selecione o Período de Recebimento
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedPeriod === "morning" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("morning")}
            className="w-full"
            type="button"
          >
            Manhã
          </Button>
          <Button
            variant={selectedPeriod === "afternoon" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("afternoon")}
            className="w-full"
            type="button"
          >
            Tarde
          </Button>
        </div>
      </div>

      {isDateValid && selectedPeriod && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>
              Recebimento agendado para{" "}
              <span className="font-medium">
                {format(new Date(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
              , período da{" "}
              <span className="font-medium">
                {selectedPeriod === "morning" ? "manhã" : "tarde"}
              </span>
              .
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 