"use client";
import { useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { GlassButton } from "@/components/ui/glass";
import { ProjetoDetailModal } from "@/components/projetos/ProjetoDetailModal";
import { CHECKLIST_KEYS, PROJETO_FUNIL_STAGES, type ChecklistKey, type KanbanStage, type Project } from "@/types/database";
import { moverEtapa } from "@/lib/actions/projects";
import { useOptimisticAction } from "@/lib/hooks/useOptimisticAction";
import { brl } from "@/lib/format";
import { calcFaseTestes } from "@/lib/testes";

function CardView({ p, doneCount, dragging = false, overlay = false }: { p: Project; doneCount: number; dragging?: boolean; overlay?: boolean }) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl p-4 border border-slate-200 dark:border-neutral-800 transition ${overlay ? "shadow-2xl border-emerald-400 dark:border-emerald-600 rotate-1 cursor-grabbing" : "cursor-grab hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md"} ${dragging ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="font-semibold text-slate-800 dark:text-neutral-100 text-sm leading-tight">{p.cliente_nome}</div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${doneCount === CHECKLIST_KEYS.length ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400"}`}>
          {doneCount}/{CHECKLIST_KEYS.length} ✓
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-lg font-bold text-slate-900 dark:text-neutral-100">{brl(p.valor_total)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Lucro</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{brl(p.valor_lucro)}</span>
        </div>
      </div>
      {p.kanban_stage === "fase_testes" && (() => {
        const info = calcFaseTestes(p.testes_iniciado_em, p.testes_dias_total);
        if (!info) return null;
        const tone = info.status === "atrasado"
          ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
        return <div className={`mt-2 text-[11px] px-2 py-1 rounded border text-center font-medium ${tone}`}>⏱ {info.label}</div>;
      })()}
    </div>
  );
}

function Card({ p, onOpen, doneCount }: { p: Project; onOpen: (p: Project) => void; doneCount: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
         onClick={(e) => { if (!isDragging) { e.stopPropagation(); onOpen(p); } }}>
      <CardView p={p} doneCount={doneCount} dragging={isDragging} />
    </div>
  );
}

function Column({ stage, label, items, onOpen, checklists }: {
  stage: KanbanStage; label: string; items: Project[]; onOpen: (p: Project) => void;
  checklists: Record<string, ChecklistKey[]>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = items.reduce((a, p) => a + Number(p.valor_total), 0);
  return (
    <div ref={setNodeRef}
         className={`min-w-[280px] flex-1 rounded-2xl p-3 flex flex-col gap-3 border transition max-h-[calc(100vh-240px)] ${isOver ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400" : "bg-slate-50/60 dark:bg-neutral-900/40 border-slate-200 dark:border-neutral-800"}`}>
      <div className="px-1 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">{label}</div>
          <span className="text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full px-2 py-0.5 text-slate-600 dark:text-neutral-300">{items.length}</span>
        </div>
        {items.length > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">{brl(total)} em pipeline</div>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[40px] flex-1 overflow-y-auto pr-1 -mr-1">
        {items.map((p) => <Card key={p.id} p={p} onOpen={onOpen} doneCount={(checklists[p.id] ?? []).length} />)}
      </div>
    </div>
  );
}

export function KanbanBoard({ projetos, checklists = {} }: {
  projetos: Project[]; checklists?: Record<string, ChecklistKey[]>;
}) {
  const [list, setList] = useState(projetos);
  const [open, setOpen] = useState<Project | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { run } = useOptimisticAction();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeProject = activeId ? list.find((p) => p.id === activeId) ?? null : null;

  const stages = PROJETO_FUNIL_STAGES;
  const stageIds = new Set(stages.map((s) => s.id));
  // Mostra só projetos cuja stage faz parte do funil único de projetos
  const filtered = list.filter((p) => stageIds.has(p.kanban_stage));

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const newStage = e.over?.id as KanbanStage | undefined;
    if (!newStage) return;
    const cur = list.find((p) => p.id === id);
    if (!cur || cur.kanban_stage === newStage) return;
    const prevStage = cur.kanban_stage;
    run({
      apply: () => setList((l) => l.map((p) => (p.id === id ? { ...p, kanban_stage: newStage } : p))),
      rollback: () => setList((l) => l.map((p) => (p.id === id ? { ...p, kanban_stage: prevStage } : p))),
      action: () => moverEtapa(id, newStage),
      errorMessage: "Não foi possível mover o projeto. Tente de novo.",
    });
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((s) => (
            <Column key={s.id} stage={s.id} label={s.label}
                    items={filtered.filter((p) => p.kanban_stage === s.id)}
                    onOpen={setOpen}
                    checklists={checklists} />
          ))}
        </div>
        <DragOverlay>
          {activeProject ? <CardView p={activeProject} doneCount={(checklists[activeProject.id] ?? []).length} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <ProjetoDetailModal project={open} onClose={() => setOpen(null)} />
    </div>
  );
}
