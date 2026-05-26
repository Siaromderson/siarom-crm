"use client";
import { useState, useMemo, useTransition } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { GlassCard, Badge, GlassButton } from "@/components/ui/glass";
import { TarefaForm } from "./TarefaForm";
import { atualizarStatusTarefa, deletarTarefa } from "@/lib/actions/tasks";
import { TASK_STATUSES, type Profile, type Project, type Task, type TaskStatus, type Prioridade } from "@/types/database";

const toneByPrio: Record<Prioridade, "blue" | "amber" | "red" | "slate"> = {
  baixa: "slate", media: "blue", alta: "amber", urgente: "red",
};

function Card({ t, projetoNome, responsavelNome, onDelete }: {
  t: Task; projetoNome?: string; responsavelNome?: string; onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: t.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
         className={`glass rounded-xl p-3 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-60" : ""}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="font-medium text-sm">{t.titulo}</div>
        <Badge tone={toneByPrio[t.prioridade]}>{t.prioridade}</Badge>
      </div>
      {t.descricao && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{t.descricao}</div>}
      <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap gap-2">
        {projetoNome && <span>📁 {projetoNome}</span>}
        {responsavelNome && <span>👤 {responsavelNome}</span>}
        {t.due_date && <span>⏰ {t.due_date}</span>}
      </div>
      <button onClick={() => onDelete(t.id)} className="text-[11px] text-red-300/70 hover:text-red-200 mt-2">excluir</button>
    </div>
  );
}

function Column({ status, label, items, mapProj, mapResp, onDelete }: {
  status: TaskStatus; label: string; items: Task[];
  mapProj: Record<string, string>; mapResp: Record<string, string>; onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`min-w-[240px] flex-1 glass rounded-2xl p-3 flex flex-col gap-3 ${isOver ? "ring-2 ring-brand-400/60" : ""}`}>
      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-semibold">{label}</div>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-[40px]">
        {items.map((t) => (
          <Card key={t.id} t={t}
                projetoNome={t.project_id ? mapProj[t.project_id] : undefined}
                responsavelNome={t.assignee_id ? mapResp[t.assignee_id] : undefined}
                onDelete={onDelete} />
        ))}
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
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const mapProj = useMemo(() => Object.fromEntries(projetos.map((p) => [p.id, p.cliente_nome])), [projetos]);
  const mapResp = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u.nome])), [usuarios]);

  const onDragEnd = async (e: DragEndEvent) => {
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
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((s) => (
              <Column key={s.id} status={s.id} label={s.label}
                      items={tasks.filter((t) => t.status === s.id)}
                      mapProj={mapProj} mapResp={mapResp} onDelete={remover} />
            ))}
          </div>
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
                <tr key={t.id} className="border-t border-white/5">
                  <td className="px-4 py-2">{t.titulo}</td>
                  <td className="px-4 py-2 text-slate-400">{t.project_id ? mapProj[t.project_id] : "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{t.assignee_id ? mapResp[t.assignee_id] : "—"}</td>
                  <td className="px-4 py-2"><Badge tone={toneByPrio[t.prioridade]}>{t.prioridade}</Badge></td>
                  <td className="px-4 py-2 text-slate-400">{t.due_date ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-400">{TASK_STATUSES.find((s) => s.id === t.status)?.label}</td>
                  <td className="px-4 py-2 text-right"><button onClick={() => remover(t.id)} className="text-red-300/70 hover:text-red-200 text-xs">excluir</button></td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">Nenhuma tarefa.</td></tr>}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
