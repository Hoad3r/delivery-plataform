"use client"

// Inspired by react-hot-toast library
import * as React from "react"
import { create } from "zustand"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

interface ToastState {
  isOpen: boolean
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
  onOpenChange: (open: boolean) => void
}

interface ToastStore extends ToastState {
  showToast: (toast: Partial<ToastState>) => void
  hideToast: () => void
}

const useToastStore = create<ToastStore>((set) => ({
  isOpen: false,
  title: undefined,
  description: undefined,
  variant: "default",
  duration: 5000,
  onOpenChange: (open) => set({ isOpen: open }),
  showToast: (toast) => {
    set({ ...toast, isOpen: true })
    if (toast.duration !== 0) {
      setTimeout(() => {
        set({ isOpen: false })
      }, toast.duration || 5000)
      }
  },
  hideToast: () => set({ isOpen: false }),
}))

export const useToast = () => {
  const store = useToastStore()
  return {
    toast: (props: Partial<ToastState>) => store.showToast(props),
    ...store,
      }
    }

export const toast = (props: Partial<ToastState>) => useToastStore.getState().showToast(props)
