"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard, Badge } from "@/components/ui/glass";
import { Globe, Phone, CalendarClock } from "lucide-react";
import { ProjetoDetailModal } from "./ProjetoDetailModal";
import { ChecklistPills } from "./ChecklistPanel";
import { brl } from "@/lib/format";
import { calcPrazoEntrega, fmtData } from "@/lib/testes";
import { KANBAN_STAGES, type ChecklistKey, type Project } from "@/types/database";

export function ProjetosListClient({ projetos, checklists = {} }: { projetos: Project[]; checklists?: Record<string, ChecklistKey[]> }) {
  const [open, setOpen] = useState<Project | null>(null);
  const stageLabel = Object.fromEntries(KANBAN_STAGES.map((s) => [s.id, s.label]));
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("open");
    if (!id) return;
    const p = projetos.find((x) => x.id === id);
    if (p) setOpen(p);
  }, [searchParams, projetos]);

  const handleClose = () => {
    setOpen(null);
    if (searchParams.get("open")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("open");
      router.replace(`/projetos${params.toString() ? `?${params}` : ""}`);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projetos.map((p) => (
          <button key={p.id} onClick={() => setOpen(p)} className="text-left">
            <GlassCard className="card-hover cursor-pointer h-full">
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold text-slate-800 dark:text-neutral-100">{p.cliente_nome}</div>
                <Badge tone="green">{stageLabel[p.kanban_stage]}</Badge>
              </div>
              {(p.site_url || p.telefone) && (
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  {p.site_url && <span className="flex items-center gap-1 truncate"><Globe size={12} />{p.site_url.replace(/^https?:\/\//, "")}</span>}
                  {p.telefone && <span className="flex items-center gap-1"><Phone size={12} />{p.telefone}</span>}
                </div>
              )}
              {p.descricao_automacao && (
                <div className="text-xs text-slate-500 mt-2 line-clamp-2">{p.descricao_automacao}</div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Total</div>
                  <div className="font-semibold text-slate-800 dark:text-neutral-100">{brl(p.valor_total)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-600 uppercase font-semibold">Sócio</div>
                  <div className="font-semibold text-amber-700 dark:text-amber-300">{brl(p.valor_comissao)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-semibold">Lucro</div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">{brl(p.valor_lucro)}</div>
                </div>
              </div>
              {(() => {
                const prazo = calcPrazoEntrega(p.prazo_entrega);
                if (!prazo) return null;
                const tone =
                  prazo.status === "atrasado" ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : prazo.status === "hoje" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                  : prazo.status === "proximo" ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300";
                return (
                  <div className={`mt-3 text-xs rounded-md border px-2.5 py-1.5 flex items-center justify-between gap-2 ${tone}`}>
                    <span className="flex items-center gap-1.5"><CalendarClock size={13} /> Prazo: {fmtData(prazo.fimEm)}</span>
                    <b>{prazo.label}</b>
                  </div>
                );
              })()}
              <ChecklistPills done={new Set(checklists[p.id] ?? [])} />
            </GlassCard>
          </button>
        ))}
        {projetos.length === 0 && (
          <GlassCard className="col-span-full text-center text-slate-500">
            Nenhum projeto ainda. Clique em <b>Novo projeto</b> para começar.
          </GlassCard>
        )}
      </div>

      <ProjetoDetailModal project={open} onClose={handleClose} />
    </>
  );
}
