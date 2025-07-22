"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, CheckCircle, XCircle, Percent, Gift, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tipos = [
  { value: "frete_gratis", label: "Frete Grátis", icon: <Truck className="h-4 w-4 inline mr-1" /> },
  { value: "marmita_gratis", label: "Marmita de Graça", icon: <Gift className="h-4 w-4 inline mr-1" /> },
  { value: "desconto", label: "Desconto (R$)", icon: <Percent className="h-4 w-4 inline mr-1" /> },
];

type Cupom = {
  id: string;
  ativo: boolean;
  tipo: string;
  valor?: number;
  descricao?: string;
  codigo?: string; // Novo campo
};

export default function CuponsAdminPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [form, setForm] = useState({ ativo: true, tipo: "frete_gratis", valor: "", codigo: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function fetchCupons() {
    const res = await fetch("/api/cupons");
    setCupons(await res.json());
  }

  useEffect(() => { fetchCupons(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/cupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        valor: form.tipo === "desconto" ? Number(form.valor) : undefined,
        codigo: form.codigo?.trim() || undefined,
      }),
    });
    setForm({ ativo: true, tipo: "frete_gratis", valor: "", codigo: "" });
    setLoading(false);
    fetchCupons();
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      setLoading(true);
      await fetch("/api/cupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setConfirmDeleteId(null);
      setLoading(false);
      fetchCupons();
      toast({
        title: "Cupom deletado",
        description: "O cupom foi removido com sucesso.",
        variant: "success"
      });
    } else {
      setConfirmDeleteId(id);
      toast({
        title: "Confirmação",
        description: "Clique novamente em deletar para confirmar a exclusão do cupom.",
        variant: "destructive"
      });
      setTimeout(() => setConfirmDeleteId(null), 4000);
    }
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    await fetch("/api/cupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    fetchCupons();
  }

  const filteredCupons = useMemo(() => {
    if (!search.trim()) return cupons;
    return cupons.filter((c) =>
      (c.tipo || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [cupons, search]);

  const ativos = cupons.filter((c) => c.ativo).length;
  const inativos = cupons.filter((c) => !c.ativo).length;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Cupons</CardTitle>
            <CardDescription>Gerencie cupons de desconto, frete grátis e brindes.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-800">{ativos} ativos</Badge>
            <Badge className="bg-red-100 text-red-800">{inativos} inativos</Badge>
            <Input
              placeholder="Buscar cupons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs rounded-none"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
          <div>
            <label className="block text-xs mb-1">Tipo</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="w-full border rounded px-2 py-1">
              {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {form.tipo === "desconto" && (
            <div>
              <label className="block text-xs mb-1">Valor (R$)</label>
              <Input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className="w-full" />
            </div>
          )}
          <div>
            <label className="block text-xs mb-1">Código</label>
            <Input type="text" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))} className="w-full" maxLength={20} placeholder="EX: FRETEGRATIS10" required />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.ativo} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
            <span className={form.ativo ? "text-green-700" : "text-red-700"}>{form.ativo ? "Ativo" : "Inativo"}</span>
            <Button type="submit" className="ml-auto" disabled={loading}>{loading ? "Salvando..." : "Criar Cupom"}</Button>
          </div>
        </form>

        <div className="border border-neutral-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="py-2 px-2 text-left font-light text-neutral-500">Código</th>
                <th className="py-2 px-2 text-left font-light text-neutral-500">Tipo</th>
                <th className="py-2 px-2 text-left font-light text-neutral-500">Valor</th>
                <th className="py-2 px-2 text-center font-light text-neutral-500">Status</th>
                <th className="py-2 px-2 text-center font-light text-neutral-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">Nenhum cupom encontrado.</td>
                </tr>
              ) : (
                filteredCupons.map(c => (
                  <tr key={c.id} className="border-t hover:bg-neutral-50">
                    <td className="py-2 px-2 font-mono text-xs">{c.codigo}</td>
                    <td className="py-2 px-2">
                      {tipos.find(t => t.value === c.tipo)?.icon} {tipos.find(t => t.value === c.tipo)?.label || c.tipo}
                    </td>
                    <td className="py-2 px-2">{c.tipo === "desconto" ? `R$ ${c.valor}` : "-"}</td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleAtivo(c.id, c.ativo)}
                        className="h-8 w-8"
                        title={c.ativo ? "Desativar" : "Ativar"}
                      >
                        {c.ativo ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                      </Button>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className={`h-8 w-8 ${confirmDeleteId === c.id ? "animate-pulse ring-2 ring-red-400" : ""}`}
                        title="Deletar"
                        disabled={loading}
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 