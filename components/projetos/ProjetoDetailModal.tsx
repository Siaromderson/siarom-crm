"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer, GlassButton, GlassInput, GlassSelect, GlassTextarea, Label, Badge } from "@/components/ui/glass";
import {
  Key, FileText, Link2, Paperclip, Trash2, Eye, EyeOff, Copy, Check, Calendar, Globe, Phone, Mail, Lock,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarProjeto, deletarProjeto } from "@/lib/actions/projects";
import { criarItem, deletarItem } from "@/lib/actions/items";
import { calcularDivisao } from "@/lib/calc";
import { brl } from "@/lib/format";
import { ResumoCalculo } from "@/components/calculadora/ResumoCalculo";
import {
  KANBAN_STAGES, ITEM_TIPOS, FUNIS, FUNIL_DE, stagesDoFunil,
  type ProjectItem, type Project, type Funil, type ItemTipo,
} from "@/types/database";

const iconByTipo = { credencial: Key, anotacao: FileText, link: Link2, arquivo: Paperclip } as const;

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function ProjetoDetailModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const router = useRouter();
  const open = !!project;
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "items">("info");
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // form state
  const [cliente, setCliente] = useState(""); const [site, setSite] = useState(""); const [tel, setTel] = useState("");
  const [desc, setDesc] = useState(""); const [reuniao, setReuniao] = useState("");
  const [total, setTotal] = useState(0); const [com, setCom] = useState(20); const [imp, setImp] = useState(15.5);
  const [funil, setFunil] = useState<Funil>("vendas");
  const [stage, setStage] = useState<Project["kanban_stage"]>("reuniao_agendada");
  const r = useMemo(() => calcularDivisao(total, com, imp), [total, com, imp]);
  const etapas = useMemo(() => stagesDoFunil(funil), [funil]);

  useEffect(() => {
    if (!project) return;
    setCliente(project.cliente_nome); setSite(project.site_url ?? ""); setTel(project.telefone ?? "");
    setDesc(project.descricao_automacao ?? ""); setReuniao(toLocalInput(project.reuniao_em));
    setTotal(project.valor_total); setCom(project.taxa_comissao); setImp(project.taxa_imposto);
    setStage(project.kanban_stage); setFunil(FUNIL_DE(project.kanban_stage));
    setTab("info"); setErro(null);

    setLoading(true);
    const supabase = createClient();
    supabase.from("siarom_crm_project_items")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems((data ?? []) as ProjectItem[]); setLoading(false); });
  }, [project]);

  if (!open || !project) return null;

  // Quando muda o funil, ajusta etapa para a primeira do funil escolhido
  const trocarFunil = (f: Funil) => {
    setFunil(f);
    const novas = stagesDoFunil(f);
    if (!novas.some((s) => s.id === stage)) setStage(novas[0].id);
  };

  const salvar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const res = await atualizarProjeto(project.id, fd);
      if (res?.error) return setErro(res.error);
      router.refresh(); onClose();
    });
  };

  const remover = () => {
    if (!confirm("Excluir este projeto e todos os items?")) return;
    start(async () => {
      const res = await deletarProjeto(project.id);
      if (res?.error) return setErro(res.error);
      router.refresh(); onClose();
    });
  };

  const recarregarItems = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("siarom_crm_project_items")
      .select("*").eq("project_id", project.id).order("created_at", { ascending: false });
    setItems((data ?? []) as ProjectItem[]);
  };

  const adicionarItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const res = await criarItem(project.id, fd);
      if (res?.error) return setErro(res.error);
      await recarregarItems();
      form.reset();
    });
  };

  const removerItem = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    await deletarItem(id);
    setItems((arr) => arr.filter((i) => i.id !== id));
  };

  const stageLabel = KANBAN_STAGES.find((s) => s.id === project.kanban_stage)?.label;

  return (
    <Drawer open onClose={onClose} title={
      <>
        <span className="truncate">{project.cliente_nome}</span>
        <Badge tone="green">{stageLabel}</Badge>
        {project.reuniao_em && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 ml-1">
            <Calendar size={13} /> {fmtDateTime(project.reuniao_em)}
          </span>
        )}
      </>
    }>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 -mx-6 px-6 sticky top-0 bg-white z-10">
        <button onClick={() => setTab("info")}
                className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${tab === "info" ? "border-emerald-500 text-emerald-700 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Informações
        </button>
        <button onClick={() => setTab("items")}
                className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${tab === "items" ? "border-emerald-500 text-emerald-700 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          Items & Credenciais <span className="ml-1 text-xs text-slate-400">({items.length})</span>
        </button>
      </div>

      {tab === "info" && (
        <form onSubmit={salvar} className="space-y-6">
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Cliente</div>
            <div className="space-y-3">
              <div><Label htmlFor="cliente_nome">Nome</Label>
                <GlassInput id="cliente_nome" name="cliente_nome" value={cliente} onChange={(e) => setCliente(e.target.value)} required /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="site_url"><span className="inline-flex items-center gap-1.5"><Globe size={13} /> Site</span></Label>
                  <GlassInput id="site_url" name="site_url" type="url" placeholder="https://..." value={site} onChange={(e) => setSite(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="telefone"><span className="inline-flex items-center gap-1.5"><Phone size={13} /> Telefone</span></Label>
                  <GlassInput id="telefone" name="telefone" placeholder="(11) 99999-9999" value={tel} onChange={(e) => setTel(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Projeto</div>
            <div className="space-y-3">
              <div><Label htmlFor="descricao_automacao">Descrição da automação</Label>
                <GlassTextarea id="descricao_automacao" name="descricao_automacao" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="reuniao_em"><span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Data/hora reunião</span></Label>
                  <GlassInput id="reuniao_em" name="reuniao_em" type="datetime-local" value={reuniao} onChange={(e) => setReuniao(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="funil">Funil</Label>
                  <GlassSelect id="funil" value={funil} onChange={(e) => trocarFunil(e.target.value as Funil)}>
                    {FUNIS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </GlassSelect>
                </div>
                <div>
                  <Label htmlFor="kanban_stage">Etapa</Label>
                  <GlassSelect id="kanban_stage" name="kanban_stage" value={stage} onChange={(e) => setStage(e.target.value as Project["kanban_stage"])}>
                    {etapas.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </GlassSelect>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Valores</div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label htmlFor="valor_total">Valor (R$)</Label>
                <GlassInput id="valor_total" name="valor_total" type="number" min={0} step="0.01" placeholder="0,00" value={total} onChange={(e) => setTotal(parseFloat(e.target.value) || 0)} /></div>
              <div><Label htmlFor="taxa_comissao">% Comissão</Label>
                <GlassInput id="taxa_comissao" name="taxa_comissao" type="number" min={0} max={100} step="0.1" value={com} onChange={(e) => setCom(parseFloat(e.target.value) || 0)} /></div>
              <div><Label htmlFor="taxa_imposto">% Imposto</Label>
                <GlassInput id="taxa_imposto" name="taxa_imposto" type="number" min={0} max={100} step="0.1" value={imp} onChange={(e) => setImp(parseFloat(e.target.value) || 0)} /></div>
            </div>
          </section>

          <section>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Preview do cálculo</div>
            <ResumoCalculo r={r} />
          </section>

          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 -mx-6 px-6 pb-2 sticky bottom-0 bg-white">
            <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</GlassButton>
            <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
            <div className="flex-1" />
            <GlassButton type="button" variant="danger" onClick={remover}>Excluir projeto</GlassButton>
          </div>

          <div className="text-xs text-slate-400 pt-1">
            Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
            {project.closed_at && ` · Fechado em ${new Date(project.closed_at).toLocaleDateString("pt-BR")}`}
          </div>
        </form>
      )}

      {tab === "items" && (
        <div className="space-y-5">
          <ItemForm onSubmit={adicionarItem} pending={pending} />
          <div className="space-y-2">
            {loading && <div className="text-sm text-slate-400">Carregando...</div>}
            {!loading && items.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">Nenhum item ainda.</div>}
            {items.map((it) => <ItemRow key={it.id} item={it} onDelete={removerItem} />)}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function ItemForm({ onSubmit, pending }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; pending: boolean }) {
  const [tipo, setTipo] = useState<ItemTipo>("credencial");

  return (
    <form onSubmit={onSubmit} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <GlassSelect id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as ItemTipo)}>
            {ITEM_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </GlassSelect>
        </div>
        <div>
          <Label htmlFor="titulo">{tipo === "credencial" ? "Nome da ferramenta" : "Título"}</Label>
          <GlassInput id="titulo" name="titulo" required placeholder={tipo === "credencial" ? "Ex: n8n, Supabase, Vercel..." : "Ex: Documentação API"} />
        </div>
      </div>

      {tipo === "credencial" && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="email"><span className="inline-flex items-center gap-1.5"><Mail size={13} /> Email / Usuário</span></Label>
            <GlassInput id="email" name="email" autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="senha"><span className="inline-flex items-center gap-1.5"><Lock size={13} /> Senha</span></Label>
            <GlassInput id="senha" name="senha" type="text" autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="link"><span className="inline-flex items-center gap-1.5"><Link2 size={13} /> Link</span></Label>
            <GlassInput id="link" name="link" type="url" placeholder="https://..." />
          </div>
        </div>
      )}

      {(tipo === "anotacao" || tipo === "arquivo") && (
        <div>
          <Label htmlFor="conteudo">{tipo === "anotacao" ? "Anotação" : "Caminho / URL do arquivo"}</Label>
          <GlassInput id="conteudo" name="conteudo" />
        </div>
      )}

      {tipo === "link" && (
        <div>
          <Label htmlFor="link">URL</Label>
          <GlassInput id="link" name="link" type="url" placeholder="https://..." />
        </div>
      )}

      <div className="flex justify-end">
        <GlassButton type="submit" disabled={pending}>Adicionar</GlassButton>
      </div>
    </form>
  );
}

/* Campo individual com ícone de copiar + show/hide para senha */
function CopyField({ icon: Icon, label, value, secret = false }: {
  icon: LucideIcon;
  label: string; value: string; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const display = secret && !show ? "•".repeat(Math.min(value.length, 16)) : value;
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 group/copy hover:border-emerald-300 transition">
      <Icon size={13} className="text-slate-400 shrink-0" />
      <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0 w-14">{label}</span>
      <span className="text-sm text-slate-700 font-mono break-all flex-1 min-w-0">{display}</span>
      {secret && (
        <button type="button" onClick={() => setShow((v) => !v)} className="p-1 rounded hover:bg-slate-200 text-slate-500" title={show ? "Ocultar" : "Mostrar"}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
      <button type="button" onClick={copy} className="p-1 rounded hover:bg-slate-200 text-slate-500" title="Copiar">
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function ItemRow({ item, onDelete }: { item: ProjectItem; onDelete: (id: string) => void }) {
  const Icon = iconByTipo[item.tipo];
  const [copiedTitle, setCopiedTitle] = useState(false);

  const copyTitle = async () => {
    await navigator.clipboard.writeText(item.titulo);
    setCopiedTitle(true); setTimeout(() => setCopiedTitle(false), 1500);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white hover:border-emerald-300 transition">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-800 text-sm">{item.titulo}</div>
            <button onClick={copyTitle} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Copiar nome">
              {copiedTitle ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
            <Badge tone="slate">{item.tipo}</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {item.email && <CopyField icon={Mail}  label="email" value={item.email} />}
            {item.senha && <CopyField icon={Lock}  label="senha" value={item.senha} secret />}
            {item.link  && <CopyField icon={Link2} label="link"  value={item.link} />}
            {item.conteudo && <div className="sm:col-span-2"><CopyField icon={FileText} label="nota" value={item.conteudo} /></div>}
          </div>
        </div>
        <button onClick={() => onDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 shrink-0" title="Excluir">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
