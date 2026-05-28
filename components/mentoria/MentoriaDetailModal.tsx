"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer, GlassButton, GlassInput, GlassSelect, GlassTextarea, Label, Badge } from "@/components/ui/glass";
import { Clock, Calendar, Trash2, Plus } from "lucide-react";
import { atualizarMentoria, deletarMentoria, registrarAula, deletarAula } from "@/lib/actions/mentorias";
import { resumoMentoria, fmtHoras } from "@/lib/mentoria";
import { brl } from "@/lib/format";
import type { Cliente, Mentoria, MentoriaAula } from "@/types/database";

const fmtData = (s: string) => new Date(s.length <= 10 ? `${s}T12:00:00` : s).toLocaleDateString("pt-BR");

export function MentoriaDetailModal({ mentoria, aulas, mentorados, onClose }: {
  mentoria: Mentoria | null;
  aulas: MentoriaAula[];
  mentorados: Pick<Cliente, "id" | "nome">[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "aulas">("info");

  const [mentoradoId, setMentoradoId] = useState("");
  const [nome, setNome] = useState("");
  const [plano, setPlano] = useState("");
  const [valor, setValor] = useState(0);
  const [imposto, setImposto] = useState(0);
  const [horas, setHoras] = useState(0);
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!mentoria) return;
    setMentoradoId(mentoria.mentorado_id ?? "");
    setNome(mentoria.mentorado_nome);
    setPlano(mentoria.plano ?? "");
    setValor(mentoria.valor_total);
    setImposto(mentoria.taxa_imposto);
    setHoras(mentoria.horas_contratadas);
    setObs(mentoria.observacoes ?? "");
    setTab("info"); setErro(null);
  }, [mentoria?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mentoria) return null;
  const r = resumoMentoria(mentoria, aulas);

  const salvar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const res = await atualizarMentoria(mentoria.id, fd);
      if (res?.error) return setErro(res.error);
      router.refresh(); onClose();
    });
  };

  const remover = () => {
    if (!confirm("Excluir esta mentoria e todas as aulas?")) return;
    start(async () => {
      const res = await deletarMentoria(mentoria.id);
      if (res?.error) return setErro(res.error);
      router.refresh(); onClose();
    });
  };

  const adicionarAula = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setErro(null);
    start(async () => {
      const res = await registrarAula(mentoria.id, fd);
      if (res?.error) return setErro(res.error);
      router.refresh();
      form.reset();
    });
  };

  const removerAula = (id: string) => {
    if (!confirm("Excluir esta aula?")) return;
    start(async () => {
      await deletarAula(id);
      router.refresh();
    });
  };

  const vincular = (id: string) => {
    setMentoradoId(id);
    const m = mentorados.find((x) => x.id === id);
    if (m) setNome(m.nome);
  };

  const toneHoras = r.horasRestantes < 0 ? "red" : r.horasRestantes === 0 ? "amber" : "green";

  return (
    <Drawer open onClose={onClose} title={
      <>
        <span className="truncate">{mentoria.mentorado_nome}</span>
        <Badge tone={toneHoras}>{fmtHoras(r.horasRestantes)} restantes</Badge>
      </>
    }>
      {/* Resumo de horas */}
      <div className="rounded-lg border border-slate-200 dark:border-neutral-800 p-4 mb-5 bg-slate-50/60 dark:bg-neutral-900/40">
        <div className="flex justify-between text-xs text-slate-500 dark:text-neutral-400 mb-1.5">
          <span className="flex items-center gap-1.5"><Clock size={13} /> {fmtHoras(r.horasUsadas)} usadas de {fmtHoras(Number(mentoria.horas_contratadas))}</span>
          <span className="font-semibold">{r.pctUsado.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${r.horasRestantes < 0 ? "bg-red-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`} style={{ width: `${r.pctUsado}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
          <div><div className="text-[10px] text-slate-400 uppercase">Restam</div><div className={`font-bold ${r.horasRestantes < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300"}`}>{fmtHoras(r.horasRestantes)}</div></div>
          <div><div className="text-[10px] text-red-500 uppercase font-semibold">Imposto</div><div className="font-semibold text-red-600 dark:text-red-400">{brl(r.imposto)}</div></div>
          <div><div className="text-[10px] text-emerald-600 uppercase font-semibold">Lucro</div><div className="font-semibold text-emerald-700 dark:text-emerald-300">{brl(r.lucro)}</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-200 dark:border-neutral-800 -mx-6 px-6">
        {[
          { id: "info", label: "Informações" },
          { id: "aulas", label: `Aulas (${aulas.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${tab === t.id ? "border-emerald-500 text-emerald-700 dark:text-emerald-300 font-medium" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <form onSubmit={salvar} className="space-y-4">
          {mentorados.length > 0 && (
            <div>
              <Label htmlFor="mentorado_id">Mentorado vinculado</Label>
              <GlassSelect id="mentorado_id" name="mentorado_id" value={mentoradoId} onChange={(e) => vincular(e.target.value)}>
                <option value="">— não vinculado —</option>
                {mentorados.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </GlassSelect>
            </div>
          )}
          <div><Label htmlFor="mentorado_nome">Nome do mentorado</Label>
            <GlassInput id="mentorado_nome" name="mentorado_nome" required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label htmlFor="plano">Plano contratado</Label>
            <GlassInput id="plano" name="plano" value={plano} onChange={(e) => setPlano(e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label htmlFor="valor_total">Valor (R$)</Label>
              <GlassInput id="valor_total" name="valor_total" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(parseFloat(e.target.value) || 0)} /></div>
            <div><Label htmlFor="taxa_imposto">% Imposto</Label>
              <GlassInput id="taxa_imposto" name="taxa_imposto" type="number" min={0} max={100} step="0.1" value={imposto} onChange={(e) => setImposto(parseFloat(e.target.value) || 0)} /></div>
            <div><Label htmlFor="horas_contratadas">Horas contratadas</Label>
              <GlassInput id="horas_contratadas" name="horas_contratadas" type="number" min={0} step="0.5" value={horas} onChange={(e) => setHoras(parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div><Label htmlFor="observacoes">Observações</Label>
            <GlassTextarea id="observacoes" name="observacoes" value={obs} onChange={(e) => setObs(e.target.value)} /></div>

          {erro && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md p-2">{erro}</div>}

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
            <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</GlassButton>
            <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
            <div className="flex-1" />
            <GlassButton type="button" variant="danger" onClick={remover}>Excluir</GlassButton>
          </div>
        </form>
      )}

      {tab === "aulas" && (
        <div className="space-y-4">
          <form onSubmit={adicionarAula} className="p-4 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/40 space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Registrar aula</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label htmlFor="data"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Data</span></Label>
                <GlassInput id="data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
              <div><Label htmlFor="duracao_horas"><span className="inline-flex items-center gap-1.5"><Clock size={13} /> Duração (horas)</span></Label>
                <GlassInput id="duracao_horas" name="duracao_horas" type="number" min={0.25} step="0.25" placeholder="ex: 1" required /></div>
            </div>
            <div><Label htmlFor="descricao">O que foi feito</Label>
              <GlassInput id="descricao" name="descricao" placeholder="Ex: revisão de fluxo n8n" /></div>
            {erro && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md p-2">{erro}</div>}
            <div className="flex justify-end">
              <GlassButton type="submit" disabled={pending}><Plus size={15} /> Registrar</GlassButton>
            </div>
          </form>

          <div className="space-y-2">
            {aulas.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
                Nenhuma aula registrada ainda.
              </div>
            )}
            {aulas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                  {fmtHoras(Number(a.duracao_horas))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 dark:text-neutral-100">{a.descricao || "Aula"}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">{fmtData(a.data)}</div>
                </div>
                <button onClick={() => removerAula(a.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 shrink-0" title="Excluir">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
