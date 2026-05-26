"use client";
import { useState } from "react";
import { GlassCard, Badge } from "@/components/ui/glass";
import { Globe, Phone } from "lucide-react";
import { ProjetoDetailModal } from "./ProjetoDetailModal";
import { brl } from "@/lib/format";
import { KANBAN_STAGES, type Project } from "@/types/database";

export function ProjetosListClient({ projetos }: { projetos: Project[] }) {
  const [open, setOpen] = useState<Project | null>(null);
  const stageLabel = Object.fromEntries(KANBAN_STAGES.map((s) => [s.id, s.label]));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projetos.map((p) => (
          <button key={p.id} onClick={() => setOpen(p)} className="text-left">
            <GlassCard className="card-hover cursor-pointer h-full">
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold text-slate-800">{p.cliente_nome}</div>
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
                  <div className="font-medium text-slate-800">{brl(p.valor_total)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Sócio</div>
                  <div className="font-medium text-amber-700">{brl(p.valor_comissao)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-semibold">Lucro</div>
                  <div className="font-semibold text-emerald-600">{brl(p.valor_lucro)}</div>
                </div>
              </div>
            </GlassCard>
          </button>
        ))}
        {projetos.length === 0 && (
          <GlassCard className="col-span-full text-center text-slate-500">
            Nenhum projeto ainda. Clique em <b>Novo projeto</b> para começar.
          </GlassCard>
        )}
      </div>

      <ProjetoDetailModal project={open} onClose={() => setOpen(null)} />
    </>
  );
}
