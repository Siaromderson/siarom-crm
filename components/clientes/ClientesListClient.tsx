"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, GlassButton, GlassInput, GlassTextarea, Label, Badge, Modal } from "@/components/ui/glass";
import { Globe, Phone, Mail, Calendar, Briefcase } from "lucide-react";
import { ClienteDetailModal } from "./ClienteDetailModal";
import { criarCliente } from "@/lib/actions/clientes";
import type { Cliente } from "@/types/database";

export function ClientesListClient({ clientes, projetosByCliente = {} }: {
  clientes: Cliente[];
  projetosByCliente?: Record<string, { id: string; cliente_nome: string }[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Cliente | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"siaromai" | "mentorado">("siaromai");

  const visiveis = clientes.filter((c) => (c.tipo ?? "siaromai") === tab);

  const criar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await criarCliente(fd);
      if (r?.error) return setErro(r.error);
      setNewOpen(false);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  };

  const hojeOuAtrasado = (iso: string | null) => {
    if (!iso) return false;
    return new Date(iso) <= new Date(new Date().setHours(23, 59, 59));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold title-grad">Clientes</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{visiveis.length} {tab === "mentorado" ? "mentorado(s)" : "cliente(s) SiaromAI"}</p>
        </div>
        <GlassButton onClick={() => setNewOpen(true)}>+ {tab === "mentorado" ? "Novo mentorado" : "Novo cliente"}</GlassButton>
      </div>

      <div className="inline-flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1 gap-1 mb-6">
        <button onClick={() => setTab("siaromai")}
                className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "siaromai" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          Clientes SiaromAI
        </button>
        <button onClick={() => setTab("mentorado")}
                className={`px-4 py-1.5 rounded-md text-sm transition ${tab === "mentorado" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          Mentorados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visiveis.map((c) => (
          <button key={c.id} onClick={() => setOpen(c)} className="text-left">
            <GlassCard className="card-hover cursor-pointer h-full">
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold text-slate-800 dark:text-neutral-100">{c.nome}</div>
                {hojeOuAtrasado(c.proximo_followup_em) && <Badge tone="amber">Follow-up hoje</Badge>}
              </div>
              <div className="space-y-1 mt-2 text-xs text-slate-500 dark:text-neutral-400">
                {c.email && <div className="flex items-center gap-1 truncate"><Mail size={12} />{c.email}</div>}
                {c.telefone && <div className="flex items-center gap-1"><Phone size={12} />{c.telefone}</div>}
                {c.site && <div className="flex items-center gap-1 truncate"><Globe size={12} />{c.site.replace(/^https?:\/\//, "")}</div>}
                {c.proximo_followup_em && <div className="flex items-center gap-1"><Calendar size={12} />{new Date(c.proximo_followup_em).toLocaleDateString("pt-BR")}</div>}
              </div>
              {(projetosByCliente[c.id] ?? []).length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                    <Briefcase size={11} /> Projetos ({projetosByCliente[c.id].length})
                  </div>
                  <div className="text-xs text-slate-600 dark:text-neutral-300 line-clamp-2">
                    {projetosByCliente[c.id].map((p) => p.cliente_nome).join(" · ")}
                  </div>
                </div>
              )}
            </GlassCard>
          </button>
        ))}
        {visiveis.length === 0 && (
          <GlassCard className="col-span-full text-center text-slate-500">
            {tab === "mentorado" ? "Nenhum mentorado ainda." : "Nenhum cliente ainda."}
          </GlassCard>
        )}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title={tab === "mentorado" ? "Novo mentorado" : "Novo cliente"} size="md">
        <form onSubmit={criar} className="space-y-3">
          <input type="hidden" name="tipo" value={tab} />
          <div><Label htmlFor="nome">Nome</Label><GlassInput id="nome" name="nome" required autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="email">Email</Label><GlassInput id="email" name="email" type="email" /></div>
            <div><Label htmlFor="telefone">Telefone</Label><GlassInput id="telefone" name="telefone" /></div>
          </div>
          <div><Label htmlFor="site">Site</Label><GlassInput id="site" name="site" type="url" placeholder="https://..." /></div>
          <div><Label htmlFor="proximo_followup_em">Próximo follow-up</Label><GlassInput id="proximo_followup_em" name="proximo_followup_em" type="datetime-local" /></div>
          <div><Label htmlFor="observacoes">Observações</Label><GlassTextarea id="observacoes" name="observacoes" /></div>
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" disabled={pending}>{pending ? "Criando..." : "Criar"}</GlassButton>
          </div>
        </form>
      </Modal>

      <ClienteDetailModal cliente={open} onClose={() => setOpen(null)} />
    </>
  );
}
