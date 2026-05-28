"use client";
import { useState } from "react";
import { LayoutGrid, KanbanSquare } from "lucide-react";
import { ProjetosListClient } from "./ProjetosListClient";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { ChecklistKey, Project } from "@/types/database";

export function ProjetosPageClient({ projetos, checklists }: {
  projetos: Project[]; checklists: Record<string, ChecklistKey[]>;
}) {
  const [view, setView] = useState<"lista" | "kanban">("lista");
  return (
    <div className="space-y-4">
      <div className="inline-flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1 gap-1">
        <button onClick={() => setView("lista")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${view === "lista" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <LayoutGrid size={15} /> Lista
        </button>
        <button onClick={() => setView("kanban")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${view === "kanban" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <KanbanSquare size={15} /> Kanban
        </button>
      </div>

      {view === "lista" ? (
        <ProjetosListClient projetos={projetos} checklists={checklists} />
      ) : (
        <KanbanBoard projetos={projetos} checklists={checklists} />
      )}
    </div>
  );
}
