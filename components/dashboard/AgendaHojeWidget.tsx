"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, ListChecks, Truck, Beaker, Calendar, Phone, Star, Repeat,
} from "lucide-react";
import { GlassCard, Badge, GlassButton } from "@/components/ui/glass";
import { atualizarStatusTarefa } from "@/lib/actions/tasks";
import { marcarFollowupFeito } from "@/lib/actions/clientes";
import { marcarFollowupLeadFeito } from "@/lib/actions/leads";
import { useOptimisticAction } from "@/lib/hooks/useOptimisticAction";
import { toneChip } from "@/lib/palette";
import type { AgendaEvento, AgendaTipo, AgendaTone } from "@/lib/agenda-types";

const iconByTipo: Record<AgendaTipo, typeof ListChecks> = {
  tarefa: ListChecks,
  entrega: Truck,
  testes_fim: Beaker,
  reuniao: Calendar,
  followup: Phone,
  evento: Star,
};

const toneClass: Record<AgendaTone, string> = {
  blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300",
  amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300",
  red:    "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300",
  green:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300",
  slate:  "bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400",
};

const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const podeMarcar = (ev: AgendaEvento) => ev.tipo === "tarefa" || ev.tipo === "followup";

const labelTipo = (ev: AgendaEvento) => {
  switch (ev.tipo) {
    case "tarefa": return "tarefa";
    case "entrega": return "entrega";
    case "testes_fim": return "fim testes";
    case "reuniao": return "reunião";
    case "followup": return "follow-up";
    case "evento": return ev.eventoTipo ?? "evento";
  }
};

export function AgendaHojeWidget({ eventos }: { eventos: AgendaEvento[] }) {
  const router = useRouter();
  const { run, pending } = useOptimisticAction();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visiveis = eventos.filter((e) => !hidden.has(e.id));

  const marcarFeito = (ev: AgendaEvento) => {
    run({
      apply: () => setHidden((p) => new Set(p).add(ev.id)),
      rollback: () =>
        setHidden((p) => {
          const n = new Set(p);
          n.delete(ev.id);
          return n;
        }),
      action: () => {
        if (ev.tipo === "tarefa") {
          return atualizarStatusTarefa(ev.id.replace("tarefa:", ""), "concluido");
        }
        if (ev.id.startsWith("followup-lead:")) {
          return marcarFollowupLeadFeito(ev.id.replace("followup-lead:", ""));
        }
        return marcarFollowupFeito(ev.id.replace("followup-cli:", ""));
      },
      errorMessage: "Não foi possível concluir. Tente de novo.",
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <GlassCard className="ring-4 ring-emerald-100 dark:ring-emerald-950/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">📅 Agenda de hoje</div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">
            {visiveis.length} item(ns) — tarefas, entregas, reuniões, follow-ups e eventos
          </div>
        </div>
        <Link href="/agenda" className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline">
          Ver agenda completa →
        </Link>
      </div>
      <div className="space-y-2">
        {visiveis.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
            Sem pendências pra hoje. ✨
          </div>
        )}
        {visiveis.map((ev) => {
          const Icon = iconByTipo[ev.tipo];
          const repetindo = ev.recorrencia && ev.recorrencia !== "none";
          const conteudo = (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ev.colorTone ? toneChip[ev.colorTone] : toneClass[ev.tone]}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 flex items-center gap-1.5">
                  <span className="truncate">{ev.titulo}</span>
                  {repetindo && <Repeat size={12} className="opacity-60 shrink-0" />}
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 flex gap-2 items-center mt-0.5 flex-wrap">
                  <Badge tone={ev.tone === "slate" ? "slate" : ev.tone === "green" ? "green" : ev.tone === "purple" ? "purple" : ev.tone === "red" ? "red" : ev.tone === "amber" ? "amber" : "blue"}>
                    {labelTipo(ev)}
                  </Badge>
                  {ev.hasTime && <span className="font-mono">{fmtHora(ev.data)}</span>}
                  {ev.contexto && <span className="truncate">· {ev.contexto}</span>}
                </div>
              </div>
              {podeMarcar(ev) && (
                <GlassButton
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); marcarFeito(ev); }}
                >
                  <CheckCircle2 size={16} /> Feito
                </GlassButton>
              )}
            </div>
          );

          if (ev.href && !podeMarcar(ev)) {
            return <Link key={ev.id} href={ev.href}>{conteudo}</Link>;
          }
          return <div key={ev.id}>{conteudo}</div>;
        })}
      </div>
    </GlassCard>
  );
}
