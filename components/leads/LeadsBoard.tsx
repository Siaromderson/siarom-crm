"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from "@dnd-kit/core";
import { GlassButton, GlassInput, GlassTextarea, GlassSelect, Label, Modal, Badge } from "@/components/ui/glass";
import { ArrowRightCircle, Globe, Phone, Briefcase, Calendar, CheckCircle2 } from "lucide-react";
import { LEAD_STAGES, type KanbanStage, type Lead } from "@/types/database";
// (LEAD_STAGES inclui reunião agendada + funil de vendas + descartes)
import { moverEtapaLead, criarLead, atualizarLead, deletarLead, converterLeadEmCliente, marcarFollowupLeadFeito } from "@/lib/actions/leads";
import { brl } from "@/lib/format";

function Card({ l, onOpen, projetos }: { l: Lead; onOpen: (l: Lead) => void; projetos?: { id: string; cliente_nome: string }[] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: l.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
         onClick={(e) => { if (!isDragging) { e.stopPropagation(); onOpen(l); } }}
         className={`bg-white dark:bg-neutral-900 rounded-xl p-3 border border-slate-200 dark:border-neutral-800 cursor-grab active:cursor-grabbing hover:border-emerald-400 dark:hover:border-emerald-700 transition ${isDragging ? "opacity-60 shadow-lg" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-800 dark:text-neutral-100 text-sm leading-tight">{l.nome}</div>
        {l.proximo_followup_em && (() => {
          const d = new Date(l.proximo_followup_em);
          const hoje = new Date(); hoje.setHours(23,59,59);
          const atrasado = d < hoje;
          return (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 shrink-0 ${atrasado ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"}`} title={`Follow-up: ${d.toLocaleString("pt-BR")}`}>
              <Calendar size={10} />{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          );
        })()}
      </div>
      <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 space-y-0.5">
        {l.telefone && <div className="flex items-center gap-1"><Phone size={11} />{l.telefone}</div>}
        {l.site && <div className="flex items-center gap-1 truncate"><Globe size={11} />{l.site.replace(/^https?:\/\//, "")}</div>}
      </div>
      {l.valor_estimado > 0 && (
        <div className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{brl(l.valor_estimado)}</div>
      )}
      {projetos && projetos.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Briefcase size={10} /> {projetos.length} projeto(s)
          </div>
          <div className="text-[11px] text-slate-600 dark:text-neutral-300 line-clamp-1 mt-0.5">
            {projetos.map((p) => p.cliente_nome).join(" · ")}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({ stage, label, items, onOpen, projetosByLead }: {
  stage: KanbanStage; label: string; items: Lead[]; onOpen: (l: Lead) => void;
  projetosByLead: Record<string, { id: string; cliente_nome: string }[]>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = items.reduce((a, l) => a + Number(l.valor_estimado), 0);
  return (
    <div ref={setNodeRef}
         className={`min-w-[260px] flex-1 rounded-2xl p-3 flex flex-col gap-3 border transition ${isOver ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400" : "bg-slate-50/60 dark:bg-neutral-900/40 border-slate-200 dark:border-neutral-800"}`}>
      <div className="px-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">{label}</div>
          <span className="text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-full px-2 py-0.5 text-slate-600 dark:text-neutral-300">{items.length}</span>
        </div>
        {items.length > 0 && <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">{brl(total)} estimado</div>}
      </div>
      <div className="flex flex-col gap-2 min-h-[40px]">
        {items.map((l) => <Card key={l.id} l={l} onOpen={onOpen} projetos={l.cliente_id ? projetosByLead[l.cliente_id] : undefined} />)}
      </div>
    </div>
  );
}

export function LeadsBoard({ leads, projetosByCliente = {} }: { leads: Lead[]; projetosByCliente?: Record<string, { id: string; cliente_nome: string }[]> }) {
  const router = useRouter();
  const [list, setList] = useState(leads);
  const [open, setOpen] = useState<Lead | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    const id = String(e.active.id);
    const ns = e.over?.id as KanbanStage | undefined;
    if (!ns) return;
    const cur = list.find((l) => l.id === id);
    if (!cur || cur.kanban_stage === ns) return;
    setList((l) => l.map((x) => (x.id === id ? { ...x, kanban_stage: ns } : x)));
    await moverEtapaLead(id, ns);
  };

  const criar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await criarLead(fd);
      if (r?.error) return setErro(r.error);
      setNewOpen(false); router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  };

  const salvarEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!open) return;
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await atualizarLead(open.id, fd);
      if (r?.error) return setErro(r.error);
      setOpen(null); router.refresh();
    });
  };

  const remover = () => {
    if (!open || !confirm("Excluir este lead?")) return;
    start(async () => {
      await deletarLead(open.id);
      setOpen(null); router.refresh();
    });
  };

  const converter = () => {
    if (!open) return;
    start(async () => {
      const r = await converterLeadEmCliente(open.id);
      if (r?.error) return setErro(r.error);
      setOpen(null); router.refresh();
      alert("Cliente e projeto criados! Veja em /clientes e /projetos.");
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold title-grad">Leads</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{leads.length} lead(s) no funil</p>
        </div>
        <GlassButton onClick={() => setNewOpen(true)}>+ Novo lead</GlassButton>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((s) => (
            <Column key={s.id} stage={s.id} label={s.label}
                    items={list.filter((l) => l.kanban_stage === s.id)} onOpen={setOpen}
                    projetosByLead={projetosByCliente} />
          ))}
        </div>
      </DndContext>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo lead" size="lg">
        <form onSubmit={criar} className="space-y-3">
          <div><Label htmlFor="nome">Nome</Label><GlassInput id="nome" name="nome" required autoFocus /></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label htmlFor="email">Email</Label><GlassInput id="email" name="email" type="email" /></div>
            <div><Label htmlFor="telefone">Telefone</Label><GlassInput id="telefone" name="telefone" /></div>
            <div><Label htmlFor="site">Site</Label><GlassInput id="site" name="site" type="url" /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label htmlFor="valor_estimado">Valor estimado (R$)</Label><GlassInput id="valor_estimado" name="valor_estimado" type="number" min={0} step="0.01" defaultValue={0} /></div>
            <div><Label htmlFor="reuniao_em">Reunião em</Label><GlassInput id="reuniao_em" name="reuniao_em" type="datetime-local" /></div>
            <div><Label htmlFor="origem">Origem</Label><GlassInput id="origem" name="origem" placeholder="Ex: Indicação, LinkedIn..." /></div>
          </div>
          <div><Label htmlFor="descricao">Descrição</Label><GlassTextarea id="descricao" name="descricao" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label htmlFor="kanban_stage">Etapa inicial</Label>
              <GlassSelect id="kanban_stage" name="kanban_stage" defaultValue="reuniao_agendada">
                {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </GlassSelect>
            </div>
            <div>
              <Label htmlFor="proximo_followup_em"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Próximo follow-up</span></Label>
              <GlassInput id="proximo_followup_em" name="proximo_followup_em" type="datetime-local" />
            </div>
          </div>
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" disabled={pending}>{pending ? "Criando..." : "Criar"}</GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? <><span>{open.nome}</span><Badge tone="green">{LEAD_STAGES.find(s => s.id === open.kanban_stage)?.label}</Badge></> : null} size="lg">
        {open && (
          <form onSubmit={salvarEdit} className="space-y-3">
            <div><Label htmlFor="nome">Nome</Label><GlassInput id="nome" name="nome" defaultValue={open.nome} required /></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label htmlFor="email">Email</Label><GlassInput id="email" name="email" type="email" defaultValue={open.email ?? ""} /></div>
              <div><Label htmlFor="telefone">Telefone</Label><GlassInput id="telefone" name="telefone" defaultValue={open.telefone ?? ""} /></div>
              <div><Label htmlFor="site">Site</Label><GlassInput id="site" name="site" type="url" defaultValue={open.site ?? ""} /></div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label htmlFor="valor_estimado">Valor estimado</Label><GlassInput id="valor_estimado" name="valor_estimado" type="number" step="0.01" defaultValue={open.valor_estimado} /></div>
              <div><Label htmlFor="reuniao_em">Reunião em</Label><GlassInput id="reuniao_em" name="reuniao_em" type="datetime-local" defaultValue={open.reuniao_em ? open.reuniao_em.slice(0,16) : ""} /></div>
              <div><Label htmlFor="origem">Origem</Label><GlassInput id="origem" name="origem" defaultValue={open.origem ?? ""} /></div>
            </div>
            <div><Label htmlFor="descricao">Descrição</Label><GlassTextarea id="descricao" name="descricao" defaultValue={open.descricao ?? ""} /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label htmlFor="kanban_stage">Etapa</Label>
                <GlassSelect id="kanban_stage" name="kanban_stage" defaultValue={open.kanban_stage}>
                  {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </GlassSelect>
              </div>
              <div>
                <Label htmlFor="proximo_followup_em"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Próximo follow-up</span></Label>
                <GlassInput id="proximo_followup_em" name="proximo_followup_em" type="datetime-local"
                            defaultValue={open.proximo_followup_em ? open.proximo_followup_em.slice(0,16) : ""} />
              </div>
            </div>
            <div><Label htmlFor="observacoes">Observações</Label><GlassTextarea id="observacoes" name="observacoes" defaultValue={open.observacoes ?? ""} /></div>

            {open.proximo_followup_em && (
              <GlassButton type="button" variant="outline"
                           onClick={() => start(async () => { await marcarFollowupLeadFeito(open.id); setOpen(null); router.refresh(); })}
                           disabled={pending}>
                <CheckCircle2 size={16} /> Follow-up feito (marca interação agora)
              </GlassButton>
            )}
            {open.ultima_interacao_em && (
              <div className="text-xs text-slate-400">Última interação: {new Date(open.ultima_interacao_em).toLocaleString("pt-BR")}</div>
            )}

            {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</GlassButton>
              <GlassButton type="button" variant="outline" onClick={converter} disabled={pending}>
                <ArrowRightCircle size={16} /> Converter em cliente + projeto
              </GlassButton>
              <div className="flex-1" />
              <GlassButton type="button" variant="danger" onClick={remover}>Excluir</GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
