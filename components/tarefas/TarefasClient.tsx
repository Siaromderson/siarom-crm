"use client";
import { useState, useMemo, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { GlassCard, Badge, GlassButton } from "@/components/ui/glass";
import { TarefaForm } from "./TarefaForm";
import { TarefaDetailDrawer } from "./TarefaDetailDrawer";
import { atualizarStatusTarefa, deletarTarefa } from "@/lib/actions/tasks";
import { useOptimisticAction } from "@/lib/hooks/useOptimisticAction";
import { TASK_STATUSES, TASK_CATEGORIAS, type Profile, type Project, type Task, type TaskStatus, type Prioridade, type TaskCategoria } from "@/types/database";
import { toneDot, toneColumn, toneBar, TASK_STATUS_TONE, type Tone } from "@/lib/palette";

type CategoriaCores = Record<TaskCategoria, Tone>;
const categoriaLabel = (c: TaskCategoria) => TASK_CATEGORIAS.find((x) => x.id === c)?.label ?? c;

const toneByPrio: Record<Prioridade, "blue" | "amber" | "red" | "slate"> = {
  baixa: "slate", media: "blue", alta: "amber", urgente: "red",
};

const PRIO_PESO: Record<Prioridade, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };

type SortBy = "prioridade" | "prazo";
type SortDir = "asc" | "desc";

function ordenar(tasks: Task[], by: SortBy, dir: SortDir): Task[] {
  const sinal = dir === "asc" ? 1 : -1;
  const copia = [...tasks];
  copia.sort((a, b) => {
    if (by === "prioridade") {
      return sinal * (PRIO_PESO[a.prioridade] - PRIO_PESO[b.prioridade]);
      // asc: baixa → urgente | desc: urgente → baixa
    }
    // Tarefas sem prazo vão sempre pro fim, em qualquer direção
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return sinal * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  });
  return copia;
}

const previewDescricao = (s: string | null) =>
  (s ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*-\s*\[( |x|X)\]\s?/, (_m, c) => (c.toLowerCase() === "x" ? "✓ " : "○ ")))
    .join("\n")
    .trim();

function SortChip({ ativo, dir, onClick, children }: {
  ativo: boolean; dir: SortDir; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
        ativo
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
          : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-emerald-300"
      }`}
      title={ativo ? `${dir === "asc" ? "Crescente" : "Decrescente"} — clique para inverter` : "Ordenar por isto"}
    >
      {children}
      {ativo && (dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  );
}

function CardView({ t, cores, dragging = false, overlay = false }: {
  t: Task; cores: CategoriaCores; dragging?: boolean; overlay?: boolean;
}) {
  const desc = previewDescricao(t.descricao);
  const tone = cores[t.categoria] ?? "slate";
  return (
    <div className={`relative glass rounded-xl p-3 pl-3.5 h-[124px] flex flex-col transition overflow-hidden ${overlay ? "shadow-2xl rotate-1 cursor-grabbing ring-2 ring-emerald-400/60" : ""} ${dragging ? "opacity-40" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${toneBar[tone]}`} />
      <div className="flex justify-between items-start gap-2 shrink-0">
        <div className="font-medium text-sm line-clamp-1">{t.titulo}</div>
        <Badge tone={toneByPrio[t.prioridade]}>{t.prioridade}</Badge>
      </div>
      <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 whitespace-pre-line flex-1">
        {desc || <span className="italic text-slate-300 dark:text-neutral-600">Sem descrição</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 shrink-0">
        <span className={`w-2 h-2 rounded-full ${toneDot[tone]}`} />
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{categoriaLabel(t.categoria)}</span>
      </div>
    </div>
  );
}

function Card({ t, cores, onOpen }: { t: Task; cores: CategoriaCores; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: t.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
         onClick={(e) => { if (!isDragging) { e.stopPropagation(); onOpen(t); } }}
         className="cursor-grab active:cursor-grabbing">
      <CardView t={t} cores={cores} dragging={isDragging} />
    </div>
  );
}

function Column({ status, label, items, cores, onOpen }: {
  status: TaskStatus; label: string; items: Task[]; cores: CategoriaCores; onOpen: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const tone = TASK_STATUS_TONE[status];
  return (
    <div ref={setNodeRef} className={`min-w-[240px] flex-1 rounded-2xl border p-3 flex flex-col gap-3 max-h-[calc(100vh-240px)] transition ${isOver ? "ring-2 ring-emerald-400/60" : ""} ${toneColumn[tone]}`}>
      <div className="flex items-center gap-2 px-1 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${toneBar[tone]}`} />
        <div className="text-sm font-semibold flex-1">{label}</div>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-[40px] flex-1 overflow-y-auto pr-1 -mr-1">
        {items.map((t) => <Card key={t.id} t={t} cores={cores} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

export function TarefasClient({
  initial, projetos, usuarios, podeEscolherResponsavel, categoriaCores,
}: {
  initial: Task[];
  projetos: Pick<Project, "id" | "cliente_nome">[];
  usuarios: Pick<Profile, "id" | "nome">[];
  podeEscolherResponsavel: boolean;
  categoriaCores: CategoriaCores;
}) {
  const router = useRouter();
  const [view, setView] = useState<"board" | "lista">("board");
  const [tasks, setTasks] = useState(initial);
  // Sincroniza com o servidor após router.refresh() (criar/excluir/editar),
  // sem precisar recarregar a página manualmente.
  useEffect(() => { setTasks(initial); }, [initial]);
  const [open, setOpen] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("prazo");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { run } = useOptimisticAction();

  const tasksOrdenadas = useMemo(() => ordenar(tasks, sortBy, sortDir), [tasks, sortBy, sortDir]);

  const toggleSort = (by: SortBy) => {
    if (sortBy === by) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(by); setSortDir("asc"); }
  };
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  const mapProj = useMemo(() => Object.fromEntries(projetos.map((p) => [p.id, p.cliente_nome])), [projetos]);
  const mapResp = useMemo(() => Object.fromEntries(usuarios.map((u) => [u.id, u.nome])), [usuarios]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const ns = e.over?.id as TaskStatus | undefined;
    if (!ns) return;
    const cur = tasks.find((t) => t.id === id);
    if (!cur || cur.status === ns) return;
    const prev = cur.status;
    run({
      apply: () => setTasks((l) => l.map((t) => (t.id === id ? { ...t, status: ns } : t))),
      rollback: () => setTasks((l) => l.map((t) => (t.id === id ? { ...t, status: prev } : t))),
      action: () => atualizarStatusTarefa(id, ns),
      errorMessage: "Não foi possível mover a tarefa. Tente de novo.",
    });
  };

  const remover = (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const removed = tasks[idx];
    run({
      apply: () => setTasks((l) => l.filter((t) => t.id !== id)),
      rollback: () =>
        setTasks((l) => {
          const next = [...l];
          next.splice(Math.min(idx, next.length), 0, removed);
          return next;
        }),
      action: () => deletarTarefa(id),
      errorMessage: "Não foi possível excluir a tarefa. Tente de novo.",
      onSuccess: () => router.refresh(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <GlassButton variant={view === "board" ? "primary" : "ghost"} onClick={() => setView("board")}>Board</GlassButton>
          <GlassButton variant={view === "lista" ? "primary" : "ghost"} onClick={() => setView("lista")}>Lista</GlassButton>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-neutral-400">Ordenar por</span>
          <SortChip ativo={sortBy === "prazo"} dir={sortDir} onClick={() => toggleSort("prazo")}>Prazo</SortChip>
          <SortChip ativo={sortBy === "prioridade"} dir={sortDir} onClick={() => toggleSort("prioridade")}>Prioridade</SortChip>
          <TarefaForm projetos={projetos} usuarios={usuarios} podeEscolherResponsavel={podeEscolherResponsavel}
                      categoriaCores={categoriaCores} onCreated={(t) => setTasks((l) => [t, ...l])} />
        </div>
      </div>

      {view === "board" ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((s) => (
              <Column key={s.id} status={s.id} label={s.label}
                      items={tasksOrdenadas.filter((t) => t.status === s.id)}
                      cores={categoriaCores}
                      onOpen={setOpen} />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <CardView t={activeTask} cores={categoriaCores} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="text-left px-4 py-2">Tarefa</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Projeto</th>
                <th className="text-left px-4 py-2">Responsável</th>
                <th className="text-left px-4 py-2">Prioridade</th>
                <th className="text-left px-4 py-2">Prazo</th>
                <th className="text-left px-4 py-2">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasksOrdenadas.map((t) => (
                <tr key={t.id} className="border-t border-white/5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition" onClick={() => setOpen(t)}>
                  <td className="px-4 py-2">{t.titulo}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                      <span className={`w-2 h-2 rounded-full ${toneDot[categoriaCores[t.categoria] ?? "slate"]}`} />
                      {categoriaLabel(t.categoria)}
                    </span>
                  </td>
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
              {tasksOrdenadas.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-6">Nenhuma tarefa.</td></tr>}
            </tbody>
          </table>
          </div>
        </GlassCard>
      )}

      <TarefaDetailDrawer
        tarefa={open}
        onClose={() => setOpen(null)}
        onDeleted={(id) => setTasks((l) => l.filter((t) => t.id !== id))}
        onUpdated={(t) => setTasks((l) => l.map((x) => (x.id === t.id ? t : x)))}
        projetos={projetos}
        usuarios={usuarios}
        podeEscolherResponsavel={podeEscolherResponsavel}
        categoriaCores={categoriaCores}
      />
    </div>
  );
}
