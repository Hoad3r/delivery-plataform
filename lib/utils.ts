export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ")
}

