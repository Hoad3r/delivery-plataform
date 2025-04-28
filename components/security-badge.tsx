import { Lock, ShieldCheck, CreditCard } from "lucide-react"

interface SecurityBadgeProps {
  variant?: "compact" | "full"
  className?: string
}

export default function SecurityBadge({ variant = "compact", className = "" }: SecurityBadgeProps) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 text-xs text-neutral-500 ${className}`}>
        <Lock className="h-3 w-3" />
        <span>Pagamento 100% seguro</span>
      </div>
    )
  }

  return (
    <div className={`border border-neutral-200 bg-neutral-50 p-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span className="text-sm text-neutral-600">Dados protegidos com criptografia</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600" />
          <span className="text-sm text-neutral-600">Pagamento 100% seguro</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-green-600" />
          <span className="text-sm text-neutral-600">Principais cartões aceitos</span>
        </div>
      </div>
    </div>
  )
}

