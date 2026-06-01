"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, GlassButton, GlassInput, GlassSelect, GlassTextarea, Label, Badge, Modal } from "@/components/ui/glass";
import { GraduationCap, Clock, Wallet, Receipt, TrendingUp, LayoutDashboard } from "lucide-react";
import { MentoriaDetailModal } from "./MentoriaDetailModal";
import { criarMentoria } from "@/lib/actions/mentorias";
import { resumoMentoria, somaFinanceiraMentorias, fmtHoras } from "@/lib/mentoria";
import { brl } from "@/lib/format";
import type { Cliente, Mentoria, MentoriaAula } from "@/types/database";

export function MentoriaPageClient({ mentorias, aulasPorMentoria, mentorados }: {
  mentorias: Mentoria[];
  aulasPorMentoria: Record<string, MentoriaAula[]>;
  mentorados: Pick<Cliente, "id" | "nome">[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Mentoria | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"visao" | "alunos">("visao");

  const fin = somaFinanceiraMentorias(mentorias);
  const linhas = mentorias.map((m) => ({ m, r: resumoMentoria(m, aulasPorMentoria[m.id] ?? []) }));
  const horasContratadas = linhas.reduce((a, x) => a + Number(x.m.horas_contratadas), 0);
  const horasUsadas = linhas.reduce((a, x) => a + x.r.horasUsadas, 0);
  const horasRestantes = horasContratadas - horasUsadas;

  const vincular = (id: string, setNome: (v: string) => void) => {
    const m = mentorados.find((x) => x.id === id);
    if (m) setNome(m.nome);
  };

  const criar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await criarMentoria(fd);
      if (r?.error) return setErro(r.error);
      setNewOpen(false);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold title-grad">Mentoria</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{mentorias.length} mentoria(s)</p>
        </div>
        <GlassButton onClick={() => setNewOpen(true)}>+ Nova mentoria</GlassButton>
      </div>

      <div className="inline-flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1 gap-1">
        <button onClick={() => setTab("visao")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${tab === "visao" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <LayoutDashboard size={15} /> Visão geral
        </button>
        <button onClick={() => setTab("alunos")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${tab === "alunos" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <GraduationCap size={15} /> Alunos
        </button>
      </div>

      {tab === "visao" && (
        <div className="space-y-6">
          <div className="text-sm text-slate-500 dark:text-neutral-400">
            Receita exclusiva de mentorias — separada da SiaromAI
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center"><Wallet size={20} /></div>
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">Receita</div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">{brl(fin.receita)}</div>
            </div>
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center"><Receipt size={20} /></div>
                <div className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">Imposto</div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">{brl(fin.imposto)}</div>
            </div>
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><TrendingUp size={20} /></div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Lucro</div>
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{brl(fin.lucro)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Contratadas</div>
              <div className="text-xl font-bold text-slate-900 dark:text-neutral-100 mt-1">{fmtHoras(horasContratadas)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Ministradas</div>
              <div className="text-xl font-bold text-slate-900 dark:text-neutral-100 mt-1">{fmtHoras(horasUsadas)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Restantes</div>
              <div className={`text-xl font-bold mt-1 ${horasRestantes < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300"}`}>{fmtHoras(horasRestantes)}</div>
            </div>
          </div>

          <GlassCard>
            <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200 mb-4">Resumo por aluno</div>
            <div className="space-y-2">
              {linhas.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
                  Nenhuma mentoria cadastrada.
                </div>
              )}
              {linhas.map(({ m, r }) => (
                <button key={m.id} onClick={() => setOpen(m)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{m.mentorado_nome}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                      {m.plano && <span className="truncate">{m.plano}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} /> {fmtHoras(r.horasUsadas)}/{fmtHoras(Number(m.horas_contratadas))}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-neutral-100 tabular-nums">{brl(m.valor_total)}</div>
                    <div className={`text-xs font-semibold tabular-nums ${r.horasRestantes < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmtHoras(r.horasRestantes)} restam</div>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "alunos" && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mentorias.map((m) => {
          const aulas = aulasPorMentoria[m.id] ?? [];
          const r = resumoMentoria(m, aulas);
          const tone = r.horasRestantes < 0 ? "red" : r.horasRestantes === 0 ? "amber" : "green";
          return (
            <button key={m.id} onClick={() => setOpen(m)} className="text-left">
              <GlassCard className="card-hover cursor-pointer h-full">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-neutral-100">{m.mentorado_nome}</div>
                    {m.plano && <div className="text-xs text-slate-500 dark:text-neutral-400">{m.plano}</div>}
                  </div>
                  <Badge tone={tone}>{fmtHoras(r.horasRestantes)} restantes</Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> {fmtHoras(r.horasUsadas)} de {fmtHoras(Number(m.horas_contratadas))}</span>
                    <span>{r.pctUsado.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${r.horasRestantes < 0 ? "bg-red-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`} style={{ width: `${r.pctUsado}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Valor</div>
                    <div className="font-semibold text-slate-800 dark:text-neutral-100">{brl(m.valor_total)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-red-500 uppercase font-semibold">Imposto</div>
                    <div className="font-semibold text-red-600 dark:text-red-400">{brl(r.imposto)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 uppercase font-semibold">Lucro</div>
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300">{brl(r.lucro)}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-3">{aulas.length} aula(s) registrada(s)</div>
              </GlassCard>
            </button>
          );
        })}
        {mentorias.length === 0 && (
          <GlassCard className="col-span-full text-center text-slate-500 py-10">
            <GraduationCap className="mx-auto mb-2 text-slate-300" size={32} />
            Nenhuma mentoria ainda. Clique em <b>Nova mentoria</b> para começar.
          </GlassCard>
        )}
      </div>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nova mentoria" size="md">
        <NovaMentoriaForm onSubmit={criar} pending={pending} erro={erro} mentorados={mentorados} vincular={vincular} />
      </Modal>

      <MentoriaDetailModal
        mentoria={open}
        aulas={open ? (aulasPorMentoria[open.id] ?? []) : []}
        mentorados={mentorados}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}

function NovaMentoriaForm({ onSubmit, pending, erro, mentorados, vincular }: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean; erro: string | null;
  mentorados: Pick<Cliente, "id" | "nome">[];
  vincular: (id: string, setNome: (v: string) => void) => void;
}) {
  const [nome, setNome] = useState("");
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {mentorados.length > 0 && (
        <div>
          <Label htmlFor="mentorado_id">Vincular a mentorado existente</Label>
          <GlassSelect id="mentorado_id" name="mentorado_id" defaultValue="" onChange={(e) => vincular(e.target.value, setNome)}>
            <option value="">— não vinculado —</option>
            {mentorados.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </GlassSelect>
        </div>
      )}
      <div><Label htmlFor="mentorado_nome">Nome do mentorado</Label>
        <GlassInput id="mentorado_nome" name="mentorado_nome" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label htmlFor="plano">Plano contratado</Label>
        <GlassInput id="plano" name="plano" placeholder="Ex: Mentoria Pro, Pacote 5h..." /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label htmlFor="valor_total">Valor (R$)</Label>
          <GlassInput id="valor_total" name="valor_total" type="number" min={0} step="0.01" defaultValue={0} /></div>
        <div><Label htmlFor="taxa_imposto">% Imposto</Label>
          <GlassInput id="taxa_imposto" name="taxa_imposto" type="number" min={0} max={100} step="0.1" defaultValue={0} /></div>
        <div><Label htmlFor="horas_contratadas">Horas</Label>
          <GlassInput id="horas_contratadas" name="horas_contratadas" type="number" min={0} step="0.5" defaultValue={0} /></div>
      </div>
      <div><Label htmlFor="observacoes">Observações</Label><GlassTextarea id="observacoes" name="observacoes" /></div>
      {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <GlassButton type="submit" disabled={pending}>{pending ? "Criando..." : "Criar mentoria"}</GlassButton>
      </div>
    </form>
  );
}
