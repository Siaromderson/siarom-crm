"use client";
import { useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { GlassButton } from "@/components/ui/glass";
import { ProjetoDetailModal } from "@/components/projetos/ProjetoDetailModal";
import { VENDAS_STAGES, POS_VENDA_STAGES, FUNIL_DE, type Funil, type KanbanStage, type Project } from "@/types/database";
import { moverEtapa } from "@/lib/actions/projects";
import { brl } from "@/lib/format";

function Card({ p, onOpen }: { p: Project; onOpen: (p: Project) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
         onClick={(e) => { if (!isDragging) { e.stopPropagation(); onOpen(p); } }}
         className={`bg-white rounded-xl p-4 border border-slate-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md transition ${isDragging ? "opacity-60 shadow-lg" : ""}`}>
      <div className="font-semibold text-slate-800 text-sm leading-tight mb-3">{p.cliente_nome}</div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-lg font-bold text-slate-900">{brl(p.valor_total)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Lucro</span>
          <span className="text-base font-bold text-emerald-600">{brl(p.valor_lucro)}</span>
        </div>
      </div>
    </div>
  );
}

function Column({ stage, label, items, onOpen }: { stage: KanbanStage; label: string; items: Project[]; onOpen: (p: Project) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = items.reduce((a, p) => a + Number(p.valor_total), 0);
  return (
    <div ref={setNodeRef}
         className={`min-w-[280px] flex-1 rounded-2xl p-3 flex flex-col gap-3 border transition ${isOver ? "bg-emerald-50 border-emerald-400" : "bg-slate-50/60 border-slate-200"}`}>
      <div className="px-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">{label}</div>
          <span className="text-xs bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-600">{items.length}</span>
        </div>
        {items.length > 0 && (
          <div className="text-[11px] text-slate-500 mt-0.5">{brl(total)} em pipeline</div>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[40px]">
        {items.map((p) => <Card key={p.id} p={p} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

export function KanbanBoard({ projetos }: { projetos: Project[] }) {
  const [list, setList] = useState(projetos);
  const [funil, setFunil] = useState<Funil>("vendas");
  const [open, setOpen] = useState<Project | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const stages = funil === "vendas" ? VENDAS_STAGES : POS_VENDA_STAGES;
  const filtered = list.filter((p) => FUNIL_DE(p.kanban_stage) === funil);

  const onDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id);
    const newStage = e.over?.id as KanbanStage | undefined;
    if (!newStage) return;
    const cur = list.find((p) => p.id === id);
    if (!cur || cur.kanban_stage === newStage) return;
    setList((l) => l.map((p) => (p.id === id ? { ...p, kanban_stage: newStage } : p)));
    await moverEtapa(id, newStage);
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1">
        <button onClick={() => setFunil("vendas")}
                className={`px-4 py-1.5 rounded-md text-sm transition ${funil === "vendas" ? "bg-white shadow text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-800"}`}>
          Funil de Vendas
        </button>
        <button onClick={() => setFunil("pos_venda")}
                className={`px-4 py-1.5 rounded-md text-sm transition ${funil === "pos_venda" ? "bg-white shadow text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-800"}`}>
          Pós-venda
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((s) => (
            <Column key={s.id} stage={s.id} label={s.label}
                    items={filtered.filter((p) => p.kanban_stage === s.id)}
                    onOpen={setOpen} />
          ))}
        </div>
      </DndContext>

      <ProjetoDetailModal project={open} onClose={() => setOpen(null)} />
    </div>
  );
}
