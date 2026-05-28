"use client";
import { useState, useMemo, useTransition } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { GlassCard, Badge, GlassButton } from "@/components/ui/glass";
import { TarefaForm } from "./TarefaForm";
import { TarefaDetailDrawer } from "./TarefaDetailDrawer";
import { atualizarStatusTarefa, deletarTarefa } from "@/lib/actions/tasks";
import { TASK_STATUSES, type Profile, type Project, type Task, type TaskStatus, type Prioridade } from "@/types/database";

const toneByPrio: Record<Prioridade, "blue" | "amber" | "red" | "slate"> = {
  baixa: "slate", media: "blue", alta: "amber", urgente: "red",
};

const previewDescricao = (s: string | null) =>
  (s ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*-\s*\[( |x|X)\]\s?/, (_m, c) => (c.toLowerCase() === "x" ? "✓ " : "○ ")))
    .join("\n")
    .trim();

function CardView({ t, dragging = false, overlay = false }: {
  t: Task; dragging?: boolean; overlay?: boolean;
}) {
  const desc = previewDescricao(t.descricao);
  return (
    <div className={`glass rounded-xl p-3 h-[104px] flex flex-col transition ${overlay ? "shadow-2xl rotate-1 cursor-grabbing ring-2 ring-emerald-400/60" : ""} ${dragging ? "opacity-40" : ""}`}>
      <div className="flex justify-between items-start gap-2 shrink-0">
        <div className="font-medium text-sm line-clamp-1">{t.titulo}</div>
        <Badge tone={toneByPrio[t.prioridade]}>{t.prioridade}</Badge>
      </div>
      <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 whitespace-pre-line flex-1">
        {desc || <span className="italic text-slate-300 dark:text-neutral-600">Sem descrição</span>}
      </div>
    </div>
  );
}

function Card({ t, onOpen }: { t: Task; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: t.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
         onClick={(e) => { if (!isDragging) { e.stopPropagation(); onOpen(t); } }}
         className="cursor-grab active:cursor-grabbing">
      <CardView t={t} dragging={isDragging} />
    </div>
  );
}

function Column({ status, label, items, onOpen }: {
  status: TaskStatus; label: string; items: Task[]; onOpen: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`min-w-[240px] flex-1 glass rounded-2xl p-3 flex flex-col gap-3 max-h-[calc(100vh-240px)] ${isOver ? "ring-2 ring-brand-400/60" : ""}`}>
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="text-sm font-semibold">{label}</div>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-[40px] flex-1 overflow-y-auto pr-1 -mr-1">
        {items.map((t) => <Card key={t.id} t={t} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

export function TarefasClient({
  initial, projetos, usuarios, podeEscolherResponsavel,
}: {
  initial: Task[];
  projetos: Pick<Project, "id" | "cliente_nome">[];
  usuarios: Pick<Profile, "id" | "nome">[];
  podeEscolherResponsavel: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<"board" | "lista">("board");
  const [tasks, setTasks] = useState(initial);
  const [open, setOpen] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  const mapProj = useMemo(() => Object.fromEntries(projetos.map((p) => [p.id, p.cliente_nome])), [projetos]);
  const mapResp = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u.nome])), [usuarios]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const ns = e.over?.id as TaskStatus | undefined;
    if (!ns) return;
    const cur = tasks.find((t) => t.id === id);
    if (!cur || cur.status === ns) return;
    setTasks((l) => l.map((t) => (t.id === id ? { ...t, status: ns } : t)));
    await atualizarStatusTarefa(id, ns);
  };

  const remover = (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    start(async () => {
      await deletarTarefa(id);
      setTasks((l) => l.filter((t) => t.id !== id));
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <GlassButton variant={view === "board" ? "primary" : "ghost"} onClick={() => setView("board")}>Board</GlassButton>
          <GlassButton variant={view === "lista" ? "primary" : "ghost"} onClick={() => setView("lista")}>Lista</GlassButton>
        </div>
        <TarefaForm projetos={projetos} usuarios={usuarios} podeEscolherResponsavel={podeEscolherResponsavel} />
      </div>

      {view === "board" ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((s) => (
              <Column key={s.id} status={s.id} label={s.label}
                      items={tasks.filter((t) => t.status === s.id)}
                      onOpen={setOpen} />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <CardView t={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="text-left px-4 py-2">Tarefa</th>
                <th className="text-left px-4 py-2">Projeto</th>
                <th className="text-left px-4 py-2">Responsável</th>
                <th className="text-left px-4 py-2">Prioridade</th>
                <th className="text-left px-4 py-2">Prazo</th>
                <th className="text-left px-4 py-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition" onClick={() => setOpen(t)}>
                  <td className="px-4 py-2">{t.titulo}</td>
                  <td className="px-4 py-2 text-slate-400">{t.project_id ? mapProj[t.project_id] : "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{t.assignee_id ? mapResp[t.assignee_id] : "—"}</td>
                  <td className="px-4 py-2"><Badge tone={toneByPrio[t.prioridade]}>{t.prioridade}</Badge></td>
                  <td className="px-4 py-2 text-slate-400">{t.due_date ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{TASK_STATUSES.find((s) => s.id === t.status)?.label}</td>
                  <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => remover(t.id)} className="text-red-300/70 hover:text-red-200 text-xs">excluir</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">Nenhuma tarefa.</td></tr>}
            </tbody>
          </table>
        </GlassCard>
      )}

      <TarefaDetailDrawer
        tarefa={open}
        onClose={() => setOpen(null)}
        projetos={projetos}
        usuarios={usuarios}
        podeEscolherResponsavel={podeEscolherResponsavel}
      />
    </div>
  );
}
