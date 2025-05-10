import type { ReactNode } from "react"
import { MinimalCheckoutNavbar } from "@/components/navbar"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <MinimalCheckoutNavbar />
      {children}
    </>
  )
} 