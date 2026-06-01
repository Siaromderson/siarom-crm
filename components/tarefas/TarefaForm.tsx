"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassButton, GlassInput, GlassSelect, Label, Modal } from "@/components/ui/glass";
import { SlashEditor } from "@/components/ui/SlashEditor";
import { criarTarefa } from "@/lib/actions/tasks";
import { TASK_STATUSES, TASK_CATEGORIAS, type Profile, type Project, type Task, type TaskCategoria } from "@/types/database";
import { toneDot, type Tone } from "@/lib/palette";

export function TarefaForm({ projetos, usuarios, podeEscolherResponsavel, categoriaCores, onCreated }: {
  projetos: Pick<Project, "id" | "cliente_nome">[];
  usuarios: Pick<Profile, "id" | "nome">[];
  podeEscolherResponsavel: boolean;
  categoriaCores: Record<TaskCategoria, Tone>;
  onCreated?: (task: Task) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<TaskCategoria>("projeto");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await criarTarefa(fd);
      if (r?.error) return setErro(r.error);
      if (r?.task) onCreated?.(r.task as Task);
      setOpen(false);
      setDescricao("");
      setCategoria("projeto");
      router.refresh();
    });
  };

  return (
    <>
      <GlassButton onClick={() => setOpen(true)}>+ Nova tarefa</GlassButton>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova tarefa" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <GlassInput id="titulo" name="titulo" required autoFocus />
            </div>
            <div>
              <Label htmlFor="project_id">Projeto</Label>
              <GlassSelect id="project_id" name="project_id" defaultValue="">
                <option value="">— sem projeto —</option>
                {projetos.map((p) => <option key={p.id} value={p.id}>{p.cliente_nome}</option>)}
              </GlassSelect>
            </div>
          </div>
          <div>
            <Label htmlFor="categoria">Tipo de tarefa</Label>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full shrink-0 ${toneDot[categoriaCores[categoria] ?? "slate"]}`} />
              <GlassSelect id="categoria" name="categoria" value={categoria}
                           onChange={(e) => setCategoria(e.target.value as TaskCategoria)}>
                {TASK_CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </GlassSelect>
            </div>
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <input type="hidden" name="descricao" value={descricao} />
            <SlashEditor value={descricao} onChange={setDescricao} />
            <div className="text-[11px] text-slate-400 mt-1">Dica: digite <b>/</b> para criar uma lista de tarefas.</div>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {podeEscolherResponsavel && (
              <div>
                <Label htmlFor="assignee_id">Responsável</Label>
                <GlassSelect id="assignee_id" name="assignee_id" defaultValue="">
                  <option value="">— ninguém —</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </GlassSelect>
              </div>
            )}
            <div>
              <Label htmlFor="status">Status</Label>
              <GlassSelect id="status" name="status" defaultValue="a_fazer">
                {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </GlassSelect>
            </div>
            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <GlassSelect id="prioridade" name="prioridade" defaultValue="media">
                <option value="baixa">Baixa</option><option value="media">Média</option>
                <option value="alta">Alta</option><option value="urgente">Urgente</option>
              </GlassSelect>
            </div>
            <div>
              <Label htmlFor="due_date">Prazo</Label>
              <GlassInput id="due_date" name="due_date" type="date" />
            </div>
          </div>
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" disabled={pending}>{pending ? "Criando..." : "Criar tarefa"}</GlassButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
