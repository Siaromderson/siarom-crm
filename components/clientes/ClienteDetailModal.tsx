"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer, GlassButton, GlassInput, GlassTextarea, Label, Badge } from "@/components/ui/glass";
import { Calendar, Globe, Phone, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarCliente, deletarCliente, marcarFollowupFeito } from "@/lib/actions/clientes";
import { useOptimisticAction } from "@/lib/hooks/useOptimisticAction";
import type { Cliente, Project, Task } from "@/types/database";
import { brl } from "@/lib/format";

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ClienteDetailModal({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const router = useRouter();
  const open = !!cliente;
  const [tab, setTab] = useState<"info" | "projetos" | "tarefas">("info");
  const [pending, start] = useTransition();
  const { run } = useOptimisticAction();
  const [erro, setErro] = useState<string | null>(null);
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [tarefas, setTarefas] = useState<Task[]>([]);

  const [nome, setNome] = useState(""); const [email, setEmail] = useState("");
  const [tel, setTel] = useState(""); const [site, setSite] = useState("");
  const [obs, setObs] = useState(""); const [followup, setFollowup] = useState("");

  useEffect(() => {
    if (!cliente) return;
    setNome(cliente.nome); setEmail(cliente.email ?? ""); setTel(cliente.telefone ?? "");
    setSite(cliente.site ?? ""); setObs(cliente.observacoes ?? "");
    setFollowup(toLocalInput(cliente.proximo_followup_em));
    setTab("info"); setErro(null);

    const supabase = createClient();
    supabase.from("siarom_crm_projects").select("*").eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjetos((data ?? []) as Project[]));
    supabase.from("siarom_crm_tasks").select("*").eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setTarefas((data ?? []) as Task[]));
  }, [cliente]);

  if (!open || !cliente) return null;

  const salvar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await atualizarCliente(cliente.id, fd);
      if (r?.error) return setErro(r.error);
      router.refresh(); onClose();
    });
  };

  const remover = () => {
    if (!confirm("Excluir este cliente?")) return;
    start(async () => {
      const r = await deletarCliente(cliente.id);
      if (r?.error) return setErro(r.error);
      router.refresh(); onClose();
    });
  };

  const concluirFollowup = () => {
    run({
      apply: () => onClose(),
      rollback: () => {},
      action: () => marcarFollowupFeito(cliente.id),
      errorMessage: "Não foi possível marcar follow-up. Tente de novo.",
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <Drawer open onClose={onClose} title={
      <>
        <span className="truncate">{cliente.nome}</span>
        {cliente.proximo_followup_em && <Badge tone="amber">Follow-up agendado</Badge>}
      </>
    }>
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-neutral-800 -mx-6 px-6 sticky top-0 bg-white dark:bg-neutral-950 z-10">
        {[
          { id: "info", label: "Informações" },
          { id: "projetos", label: `Projetos (${projetos.length})` },
          { id: "tarefas", label: `Tarefas (${tarefas.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${tab === t.id ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 font-medium" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <form onSubmit={salvar} className="space-y-5">
          <div><Label htmlFor="nome">Nome</Label>
            <GlassInput id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label htmlFor="email"><span className="inline-flex items-center gap-1.5"><Mail size={13} /> Email</span></Label>
              <GlassInput id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="telefone"><span className="inline-flex items-center gap-1.5"><Phone size={13} /> Telefone</span></Label>
              <GlassInput id="telefone" name="telefone" value={tel} onChange={(e) => setTel(e.target.value)} /></div>
            <div><Label htmlFor="site"><span className="inline-flex items-center gap-1.5"><Globe size={13} /> Site</span></Label>
              <GlassInput id="site" name="site" type="url" value={site} onChange={(e) => setSite(e.target.value)} /></div>
            <div>
              <Label htmlFor="proximo_followup_em"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Próximo follow-up</span></Label>
              <GlassInput id="proximo_followup_em" name="proximo_followup_em" type="datetime-local" value={followup} onChange={(e) => setFollowup(e.target.value)} />
            </div>
          </div>
          <div><Label htmlFor="observacoes">Observações</Label>
            <GlassTextarea id="observacoes" name="observacoes" value={obs} onChange={(e) => setObs(e.target.value)} /></div>

          {cliente.proximo_followup_em && (
            <GlassButton type="button" variant="outline" onClick={concluirFollowup}>
              <CheckCircle2 size={16} /> Follow-up feito (marca interação agora e limpa data)
            </GlassButton>
          )}

          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}

          <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</GlassButton>
            <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
            <div className="flex-1" />
            <GlassButton type="button" variant="danger" onClick={remover}>Excluir</GlassButton>
          </div>
          {cliente.ultima_interacao_em && (
            <div className="text-xs text-slate-400">Última interação: {new Date(cliente.ultima_interacao_em).toLocaleString("pt-BR")}</div>
          )}
        </form>
      )}

      {tab === "projetos" && (
        <div className="space-y-2">
          {projetos.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">Nenhum projeto vinculado.</div>}
          {projetos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onClose(); router.push(`/projetos?open=${p.id}`); }}
              className="w-full text-left card p-3 flex items-center justify-between hover:border-emerald-300 transition cursor-pointer"
            >
              <div>
                <div className="font-medium text-slate-800 dark:text-neutral-100 text-sm">{p.cliente_nome}</div>
                <div className="text-xs text-slate-500">{p.kanban_stage}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-700 dark:text-neutral-200">{brl(p.valor_total)}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">{brl(p.valor_lucro)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "tarefas" && (
        <div className="space-y-2">
          {tarefas.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">Nenhuma tarefa vinculada.</div>}
          {tarefas.map((t) => (
            <div key={t.id} className="card p-3">
              <div className="font-medium text-slate-800 dark:text-neutral-100 text-sm">{t.titulo}</div>
              <div className="text-xs text-slate-500 mt-1 flex gap-3">
                <span>{t.status}</span>
                {t.due_date && <span>⏰ {t.due_date}</span>}
                <Badge tone={t.tipo === "followup" ? "amber" : "slate"}>{t.tipo}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
