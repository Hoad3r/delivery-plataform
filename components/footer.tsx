import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#f4f1ea] text-[#2F5F53] py-1 text-center text-[11px] font-medium flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <span>&copy; {new Date().getFullYear()} Nossa Cozinha</span>
      <span>|</span>
      <a href="mailto:contato@nossacozinha.com.br" className="hover:underline">contato@nossacozinha.com.br</a>
      <span>|</span>
      <span>João Pessoa - PB</span>
    </footer>
  )
}

