import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white shadow-lg text-[#2F5F53] py-1 text-center text-[11px] font-medium flex flex-wrap items-center justify-center gap-x-4 gap-y-1 w-full sticky bottom-0 z-50">
      <span>&copy; {new Date().getFullYear()} Nossa Cozinha</span>
      <span>|</span>
      <a href="mailto:nossacozinhajp@gmail.com" className="hover:underline">nossacozinhajp@gmail.com</a>
      <span>|</span>
      <span>João Pessoa - PB</span>
    </footer>
  )
}

