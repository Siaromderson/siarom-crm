"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer, GlassButton, GlassInput, GlassSelect, Label, Badge } from "@/components/ui/glass";
import { SlashEditor } from "@/components/ui/SlashEditor";
import { Calendar, User, Briefcase, Flag, ListChecks, Tag } from "lucide-react";
import { atualizarTarefa, deletarTarefa } from "@/lib/actions/tasks";
import { createClient } from "@/lib/supabase/client";
import { UploadDropzone, ArquivosList } from "@/components/arquivos/ArquivosList";
import { TASK_STATUSES, TASK_CATEGORIAS, type Profile, type Project, type ProjectFile, type Task, type Prioridade, type TaskCategoria } from "@/types/database";
import { toneDot, type Tone } from "@/lib/palette";

const toneByPrio: Record<Prioridade, "blue" | "amber" | "red" | "slate"> = {
  baixa: "slate", media: "blue", alta: "amber", urgente: "red",
};

export function TarefaDetailDrawer({
  tarefa, onClose, onDeleted, onUpdated, projetos, usuarios, podeEscolherResponsavel, categoriaCores,
}: {
  tarefa: Task | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (task: Task) => void;
  projetos: Pick<Project, "id" | "cliente_nome">[];
  usuarios: Pick<Profile, "id" | "nome">[];
  podeEscolherResponsavel: boolean;
  categoriaCores: Record<TaskCategoria, Tone>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [status, setStatus] = useState<Task["status"]>("a_fazer");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [categoria, setCategoria] = useState<TaskCategoria>("projeto");
  const [dueDate, setDueDate] = useState("");
  const [arquivos, setArquivos] = useState<ProjectFile[]>([]);

  const recarregarArquivos = async () => {
    if (!tarefa) return;
    const supabase = createClient();
    const { data } = await supabase.from("siarom_crm_files")
      .select("*").eq("owner_type", "tarefa").eq("owner_id", tarefa.id)
      .order("created_at", { ascending: false });
    setArquivos((data ?? []) as ProjectFile[]);
  };

  useEffect(() => {
    if (!tarefa) return;
    setTitulo(tarefa.titulo);
    setDescricao(tarefa.descricao ?? "");
    setProjectId(tarefa.project_id ?? "");
    setAssigneeId(tarefa.assignee_id ?? "");
    setStatus(tarefa.status);
    setPrioridade(tarefa.prioridade);
    setCategoria(tarefa.categoria ?? "projeto");
    setDueDate(tarefa.due_date ?? "");
    setErro(null);
    recarregarArquivos();
  }, [tarefa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tarefa) return null;

  const salvar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await atualizarTarefa(tarefa.id, fd);
      if (r?.error) return setErro(r.error);
      if (r?.task) onUpdated?.(r.task as Task);
      router.refresh();
      onClose();
    });
  };

  const remover = () => {
    if (!confirm("Excluir esta tarefa?")) return;
    const id = tarefa.id;
    onDeleted?.(id);   // remove da tela na hora
    onClose();
    start(async () => {
      const r = await deletarTarefa(id);
      if (r?.error) return setErro(r.error);
      router.refresh();
    });
  };

  return (
    <Drawer open onClose={onClose} title={
      <>
        <span className="truncate">{tarefa.titulo}</span>
        <Badge tone={toneByPrio[tarefa.prioridade]}>{tarefa.prioridade}</Badge>
      </>
    }>
      <form onSubmit={salvar} className="space-y-5">
        <div>
          <Label htmlFor="titulo">Título</Label>
          <GlassInput id="titulo" name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="descricao">Descrição</Label>
          <input type="hidden" name="descricao" value={descricao} />
          <SlashEditor value={descricao} onChange={setDescricao} />
          <div className="text-[11px] text-slate-400 mt-1">Dica: digite <b>/</b> para criar uma lista de tarefas.</div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="project_id"><span className="inline-flex items-center gap-1.5"><Briefcase size={13} /> Projeto</span></Label>
            <GlassSelect id="project_id" name="project_id" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— sem projeto —</option>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente_nome}</option>)}
            </GlassSelect>
          </div>

          {podeEscolherResponsavel ? (
            <div>
              <Label htmlFor="assignee_id"><span className="inline-flex items-center gap-1.5"><User size={13} /> Responsável</span></Label>
              <GlassSelect id="assignee_id" name="assignee_id" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">— ninguém —</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </GlassSelect>
            </div>
          ) : (
            <input type="hidden" name="assignee_id" value={assigneeId} />
          )}
        </div>

        <div>
          <Label htmlFor="categoria"><span className="inline-flex items-center gap-1.5"><Tag size={13} /> Tipo de tarefa</span></Label>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${toneDot[categoriaCores[categoria] ?? "slate"]}`} />
            <GlassSelect id="categoria" name="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as TaskCategoria)}>
              {TASK_CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </GlassSelect>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="status"><span className="inline-flex items-center gap-1.5"><ListChecks size={13} /> Status</span></Label>
            <GlassSelect id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
              {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </GlassSelect>
          </div>
          <div>
            <Label htmlFor="prioridade"><span className="inline-flex items-center gap-1.5"><Flag size={13} /> Prioridade</span></Label>
            <GlassSelect id="prioridade" name="prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </GlassSelect>
          </div>
          <div>
            <Label htmlFor="due_date"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Prazo</span></Label>
            <GlassInput id="due_date" name="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {erro && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md p-2">{erro}</div>}

        <div className="pt-5 border-t border-slate-100 dark:border-neutral-800 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Arquivos ({arquivos.length})</div>
          <UploadDropzone ownerType="tarefa" ownerId={tarefa.id} onUploaded={recarregarArquivos} />
          <ArquivosList arquivos={arquivos} onDelete={recarregarArquivos} />
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
          <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</GlassButton>
          <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
          <div className="flex-1" />
          <GlassButton type="button" variant="danger" onClick={remover}>Excluir</GlassButton>
        </div>

        <div className="text-xs text-slate-400">
          Criada em {new Date(tarefa.created_at).toLocaleString("pt-BR")}
        </div>
      </form>
    </Drawer>
  );
}
