"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { marcarChecklist, desmarcarChecklist } from "@/lib/actions/checklist";
import { CHECKLIST_KEYS, type ChecklistKey } from "@/types/database";

export function ChecklistPanel({ projectId, done }: { projectId: string; done: Set<ChecklistKey> }) {
  const router = useRouter();
  const [local, setLocal] = useState<Set<ChecklistKey>>(new Set(done));
  const [, start] = useTransition();

  // Sincroniza se o pai mandar um done novo (ex: outro componente atualizou)
  useEffect(() => { setLocal(new Set(done)); }, [done]);

  const toggle = (key: ChecklistKey) => {
    // Atualização otimista — UI muda na hora
    const wasDone = local.has(key);
    setLocal((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(key); else next.add(key);
      return next;
    });

    // Server action em background
    start(async () => {
      const r = wasDone ? await desmarcarChecklist(projectId, key) : await marcarChecklist(projectId, key);
      if (r?.error) {
        // Rollback se der erro
        setLocal((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(key); else next.delete(key);
          return next;
        });
        alert(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {CHECKLIST_KEYS.map((item) => {
        const ok = local.has(item.id);
        return (
          <button key={item.id} type="button" onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm transition ${ok ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200" : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-emerald-300"}`}>
            {ok ? <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Circle size={16} className="text-slate-300 dark:text-neutral-600 shrink-0" />}
            <span className={ok ? "line-through opacity-80" : ""}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Pills horizontais compactas (usadas no card da lista de projetos). */
export function ChecklistPills({ done }: { done: Set<ChecklistKey> }) {
  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {CHECKLIST_KEYS.map((item) => {
        const ok = done.has(item.id);
        return (
          <span key={item.id} title={item.label}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${ok ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-medium" : "bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500"}`}>
            {ok && "✓ "}{item.short}
          </span>
        );
      })}
    </div>
  );
}
