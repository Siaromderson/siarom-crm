"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, Badge, GlassButton } from "@/components/ui/glass";
import { CheckCircle2, ListChecks, Phone, Calendar } from "lucide-react";
import { atualizarStatusTarefa } from "@/lib/actions/tasks";
import { marcarFollowupFeito } from "@/lib/actions/clientes";
import { marcarFollowupLeadFeito } from "@/lib/actions/leads";
import { useOptimisticAction } from "@/lib/hooks/useOptimisticAction";
import type { TarefaDoDia } from "@/lib/followups";

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function HojeWidget({ itens }: { itens: TarefaDoDia[] }) {
  const router = useRouter();
  const { run, pending } = useOptimisticAction();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const marcarFeito = (it: TarefaDoDia) => {
    run({
      apply: () => setHidden((prev) => new Set(prev).add(it.id)),
      rollback: () =>
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(it.id);
          return next;
        }),
      action: () => {
        if (it.tipo === "task") {
          return atualizarStatusTarefa(it.id.replace("task:", ""), "concluido");
        }
        if (it.id.startsWith("followup-lead:")) {
          return marcarFollowupLeadFeito(it.id.replace("followup-lead:", ""));
        }
        return marcarFollowupFeito(it.id.replace("followup:", ""));
      },
      errorMessage: "Não foi possível concluir. Tente de novo.",
      onSuccess: () => router.refresh(),
    });
  };

  const visiveis = itens.filter((it) => !hidden.has(it.id));

  const iconOf = (t: TarefaDoDia["tipo"]) => t === "task" ? ListChecks : t === "followup" ? Phone : Calendar;
  const toneOf = (t: TarefaDoDia["tipo"]) => t === "task" ? "slate" : t === "followup" ? "amber" : "green";

  return (
    <GlassCard className="ring-4 ring-emerald-100 dark:ring-emerald-950/40">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">📅 Hoje</div>
          <div className="text-xs text-slate-500 dark:text-neutral-400">{visiveis.length} item(ns) — tarefas, follow-ups e reuniões</div>
        </div>
      </div>
      <div className="space-y-2">
        {visiveis.length === 0 && (
          <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
            Sem pendências pra hoje. ✨
          </div>
        )}
        {visiveis.map((it) => {
          const Icon = iconOf(it.tipo);
          const isReuniao = it.tipo === "reuniao";
          return (
            <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 dark:text-neutral-100">{it.titulo}</div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 flex gap-2 items-center mt-0.5">
                  <Badge tone={toneOf(it.tipo)}>{it.tipo}</Badge>
                  <span>{fmt(it.due_at)}</span>
                  {it.contexto && <span className="truncate">· {it.contexto}</span>}
                </div>
              </div>
              {!isReuniao && (
                <GlassButton type="button" variant="outline" disabled={pending} onClick={() => marcarFeito(it)}>
                  <CheckCircle2 size={16} /> Feito
                </GlassButton>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
