"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard, Badge, GlassSelect, Label } from "@/components/ui/glass";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  AlertTriangle, CalendarClock, CalendarCheck, CalendarX, Phone,
  TrendingUp, Briefcase, ArrowRight, ClipboardList, Wallet,
  Wallet as WalletIcon, Users, Receipt, type LucideIcon,
} from "lucide-react";
import { calcPrazoEntrega, calcFaseTestes, fmtData } from "@/lib/testes";
import { brl, pct } from "@/lib/format";
import { realizationOf, sumRealization, sumDescartados } from "@/lib/realization";
import { KANBAN_STAGES, POS_VENDA_STAGES, isDescartado, type Cliente, type Lead, type Project } from "@/types/database";

const DIA_MS = 1000 * 60 * 60 * 24;
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const diffDias = (target: Date) => Math.ceil((target.getTime() - startOfDay().getTime()) / DIA_MS);
const parseDate = (s: string) => new Date(s.length <= 10 ? `${s}T23:59:59` : s);

/* ===================== KPI cards ===================== */

function KpiCard({ icon: Icon, label, value, hint, tone }: {
  icon: LucideIcon; label: string; value: string | number; hint?: string;
  tone: "red" | "amber" | "emerald" | "slate";
}) {
  const tones = {
    red:     { bar: "bg-red-500",     bg: "bg-red-50 dark:bg-red-950/40",         icon: "text-red-600 dark:text-red-400",         text: "text-red-700 dark:text-red-300" },
    amber:   { bar: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",     icon: "text-amber-600 dark:text-amber-400",     text: "text-amber-700 dark:text-amber-300" },
    emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300" },
    slate:   { bar: "bg-slate-400",   bg: "bg-slate-100 dark:bg-neutral-800/60",  icon: "text-slate-600 dark:text-neutral-300",   text: "text-slate-700 dark:text-neutral-200" },
  }[tone];
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${tones.bar}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${tones.bg} ${tones.icon} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${tones.text}`}>{label}</div>
      </div>
      <div className="mt-3 text-3xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{hint}</div>}
    </div>
  );
}

const FIN_ACCENTS = {
  sky:     { bar: "bg-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/40",         icon: "text-sky-600 dark:text-sky-400",         text: "text-sky-700 dark:text-sky-300",         fill: "from-sky-400 to-sky-600",         track: "bg-sky-100 dark:bg-sky-950/40" },
  amber:   { bar: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40",     icon: "text-amber-600 dark:text-amber-400",     text: "text-amber-700 dark:text-amber-300",     fill: "from-amber-400 to-amber-600",     track: "bg-amber-100 dark:bg-amber-950/40" },
  red:     { bar: "bg-red-400",     bg: "bg-red-50 dark:bg-red-950/40",         icon: "text-red-600 dark:text-red-400",         text: "text-red-700 dark:text-red-300",         fill: "from-red-300 to-red-500",         track: "bg-red-100 dark:bg-red-950/40" },
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", fill: "from-emerald-400 to-emerald-600", track: "bg-emerald-100 dark:bg-emerald-950/40" },
} as const;

function DualKpi({ icon: Icon, label, atual, previsto, accent }: {
  icon: LucideIcon; label: string; atual: number; previsto: number;
  accent: keyof typeof FIN_ACCENTS;
}) {
  const c = FIN_ACCENTS[accent];
  const ratio = previsto > 0 ? Math.min(100, (atual / previsto) * 100) : 0;
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.icon} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{label}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">{brl(atual)}</span>
        <span className="text-xs text-slate-400">/ {brl(previsto)}</span>
      </div>
      <div className={`mt-2 h-1.5 ${c.track} rounded-full overflow-hidden`}>
        <div className={`h-full bg-gradient-to-r ${c.fill} transition-all duration-700 ease-out`} style={{ width: `${ratio}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>realizado</span>
        <span className="font-semibold">{pct(ratio, 0)}</span>
      </div>
    </div>
  );
}

/* ===================== Período (financeiro) ===================== */

const periodos = [
  { id: "mes", label: "Mês atual" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "ano", label: "Ano" },
  { id: "tudo", label: "Tudo" },
] as const;
type Periodo = typeof periodos[number]["id"];

function inRange(d: Date, p: Periodo) {
  const now = new Date();
  if (p === "tudo") return true;
  if (p === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const map: Record<Exclude<Periodo, "mes" | "tudo">, number> = { "3m": 3, "6m": 6, ano: 12 };
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - map[p as keyof typeof map]);
  return d >= cutoff;
}

/* ===================== Componente principal ===================== */

type Aba = "operacional" | "financeiro";

export function DashboardClient({
  projetos, clientesFollowup, leadsFollowup,
}: {
  projetos: Project[];
  clientesFollowup: Pick<Cliente, "id" | "nome" | "proximo_followup_em">[];
  leadsFollowup: Pick<Lead, "id" | "nome" | "proximo_followup_em">[];
}) {
  const [aba, setAba] = useState<Aba>("operacional");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold title-grad">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Visão geral — alterne entre acompanhamento operacional e financeiro
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1 gap-1">
        <button onClick={() => setAba("operacional")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${aba === "operacional" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <ClipboardList size={15} /> Demandas & Entregas
        </button>
        <button onClick={() => setAba("financeiro")}
                className={`px-4 py-1.5 rounded-md text-sm transition flex items-center gap-2 ${aba === "financeiro" ? "bg-white dark:bg-neutral-800 shadow text-emerald-700 dark:text-emerald-300 font-semibold" : "text-slate-600 dark:text-neutral-300 hover:text-slate-800"}`}>
          <Wallet size={15} /> Financeiro
        </button>
      </div>

      {aba === "operacional" ? (
        <SecaoOperacional
          projetos={projetos}
          clientesFollowup={clientesFollowup}
          leadsFollowup={leadsFollowup}
        />
      ) : (
        <SecaoFinanceiro projetos={projetos} />
      )}
    </div>
  );
}

/* ===================== Aba: Operacional ===================== */

function SecaoOperacional({
  projetos, clientesFollowup, leadsFollowup,
}: {
  projetos: Project[];
  clientesFollowup: Pick<Cliente, "id" | "nome" | "proximo_followup_em">[];
  leadsFollowup: Pick<Lead, "id" | "nome" | "proximo_followup_em">[];
}) {
  const ativos = useMemo(() => projetos.filter((p) =>
    !isDescartado(p.kanban_stage) && p.kanban_stage !== "finalizado" && p.kanban_stage !== "pagamento_final"
  ), [projetos]);

  const buckets = useMemo(() => {
    const atrasados: Project[] = [];
    const hoje: Project[] = [];
    const semana: Project[] = [];
    const mais: Project[] = [];
    const semPrazo: Project[] = [];
    for (const p of ativos) {
      if (!p.prazo_entrega) { semPrazo.push(p); continue; }
      const d = diffDias(parseDate(p.prazo_entrega));
      if (d < 0) atrasados.push(p);
      else if (d === 0) hoje.push(p);
      else if (d <= 7) semana.push(p);
      else if (d <= 30) mais.push(p);
    }
    return { atrasados, hoje, semana, mais, semPrazo };
  }, [ativos]);

  const proximasEntregas = useMemo(() => ativos
    .filter((p) => p.prazo_entrega)
    .map((p) => ({ p, info: calcPrazoEntrega(p.prazo_entrega)! }))
    .sort((a, b) => a.info.fimEm.getTime() - b.info.fimEm.getTime())
    .slice(0, 8), [ativos]);

  const proximosFollowups = useMemo(() => {
    const limite = startOfDay(); limite.setDate(limite.getDate() + 14);
    const items: { id: string; nome: string; data: Date; tipo: "cliente" | "lead"; ref: string }[] = [];
    for (const c of clientesFollowup) {
      if (!c.proximo_followup_em) continue;
      const d = new Date(c.proximo_followup_em);
      if (d <= limite) items.push({ id: c.id, nome: c.nome, data: d, tipo: "cliente", ref: "/clientes" });
    }
    for (const l of leadsFollowup) {
      if (!l.proximo_followup_em) continue;
      const d = new Date(l.proximo_followup_em);
      if (d <= limite) items.push({ id: l.id, nome: l.nome, data: d, tipo: "lead", ref: "/leads" });
    }
    return items.sort((a, b) => a.data.getTime() - b.data.getTime()).slice(0, 8);
  }, [clientesFollowup, leadsFollowup]);

  const fasesTestes = useMemo(() => ativos
    .filter((p) => p.kanban_stage === "fase_testes")
    .map((p) => ({ p, info: calcFaseTestes(p.testes_iniciado_em, p.testes_dias_total) }))
    .filter((x) => x.info)
    .sort((a, b) => (a.info!.diasRestantes - b.info!.diasRestantes)), [ativos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard tone="red"     icon={AlertTriangle} label="Atrasados"       value={buckets.atrasados.length} hint="Prazo de entrega vencido" />
        <KpiCard tone="amber"   icon={CalendarX}     label="Entrega hoje"    value={buckets.hoje.length}      hint="Termina hoje" />
        <KpiCard tone="emerald" icon={CalendarCheck} label="Próximos 7 dias" value={buckets.semana.length}    hint={`+${buckets.mais.length} nos próximos 30`} />
        <KpiCard tone="slate"   icon={Briefcase}     label="Sem prazo"       value={buckets.semPrazo.length}  hint="Projetos ativos sem data" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Próximas entregas</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400">Ordenado por prazo, atrasados no topo</div>
            </div>
            <Link href="/projetos" className="text-xs text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {proximasEntregas.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
                Nenhum projeto com prazo definido.
              </div>
            )}
            {proximasEntregas.map(({ p, info }) => {
              const tone =
                info.status === "atrasado" ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
                : info.status === "hoje" || info.status === "proximo" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
              return (
                <Link key={p.id} href={`/projetos?open=${p.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center shrink-0">
                    <CalendarClock size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{p.cliente_nome}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400">Entrega em {fmtData(info.fimEm)}</div>
                  </div>
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${tone} tabular-nums shrink-0`}>{info.label}</div>
                </Link>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Próximos follow-ups</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400">Próximos 14 dias</div>
            </div>
          </div>
          <div className="space-y-2">
            {proximosFollowups.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
                Nada agendado.
              </div>
            )}
            {proximosFollowups.map((f) => {
              const d = diffDias(f.data);
              const label = d < 0 ? `${Math.abs(d)}d atrasado` : d === 0 ? "Hoje" : `em ${d}d`;
              const tone: "red" | "amber" | "slate" = d < 0 ? "red" : d === 0 ? "amber" : "slate";
              return (
                <Link key={`${f.tipo}:${f.id}`} href={f.ref}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Phone size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{f.nome}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                      <span>{f.data.toLocaleDateString("pt-BR")}</span>
                      <Badge tone={f.tipo === "lead" ? "amber" : "slate"}>{f.tipo}</Badge>
                    </div>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </Link>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Em fase de testes</div>
            <div className="text-xs text-slate-500 dark:text-neutral-400">Acompanhamento da janela de homologação</div>
          </div>
        </div>
        <div className="space-y-2">
          {fasesTestes.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
              Nenhum projeto em fase de testes.
            </div>
          )}
          {fasesTestes.map(({ p, info }) => {
            const tone = info!.status === "atrasado"
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
            return (
              <Link key={p.id} href={`/projetos?open=${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition bg-white dark:bg-neutral-900">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{p.cliente_nome}</div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400">Termina em {fmtData(info!.fimEm)}</div>
                </div>
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${tone} tabular-nums shrink-0`}>{info!.label}</div>
              </Link>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

/* ===================== Aba: Financeiro ===================== */

function SecaoFinanceiro({ projetos }: { projetos: Project[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("6m");
  const filtrados = useMemo(() => projetos.filter((p) => inRange(new Date(p.created_at), periodo)), [projetos, periodo]);

  const real = useMemo(() => sumRealization(filtrados), [filtrados]);
  const desc = useMemo(() => sumDescartados(filtrados), [filtrados]);
  const ativos = filtrados.filter((p) => !isDescartado(p.kanban_stage));
  const ticketAtual    = ativos.length ? real.receitaAtual    / ativos.length : 0;
  const ticketPrevisto = ativos.length ? real.receitaPrevista / ativos.length : 0;
  const taxaDescarte = filtrados.length > 0 ? (desc.count / filtrados.length) * 100 : 0;
  const pctRealizado = real.receitaPrevista > 0 ? (real.receitaAtual / real.receitaPrevista) * 100 : 0;

  const porMes = useMemo(() => {
    const m = new Map<string, { mes: string; receitaAtual: number; receitaPrevista: number; lucroAtual: number; lucroPrevisto: number }>();
    for (const p of filtrados) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = realizationOf(p);
      const cur = m.get(key) ?? { mes: key, receitaAtual: 0, receitaPrevista: 0, lucroAtual: 0, lucroPrevisto: 0 };
      cur.receitaAtual    += r.receitaAtual;
      cur.receitaPrevista += r.receitaPrevista;
      cur.lucroAtual      += r.lucroAtual;
      cur.lucroPrevisto   += r.lucroPrevista;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filtrados]);

  const porEtapa = useMemo(() => {
    const m = new Map<string, { etapa: string; previsto: number; atual: number; n: number }>();
    for (const s of KANBAN_STAGES) m.set(s.id, { etapa: s.label, previsto: 0, atual: 0, n: 0 });
    for (const p of filtrados) {
      const r = realizationOf(p);
      const cur = m.get(p.kanban_stage)!;
      cur.previsto += r.receitaPrevista;
      cur.atual    += r.receitaAtual;
      cur.n += 1;
    }
    return Array.from(m.values()).filter((x) => x.n > 0);
  }, [filtrados]);

  const donut = [
    { name: "Sócio",   value: real.comissaoPrevista, color: "#fbbf24" },
    { name: "Imposto", value: real.impostoPrevista,  color: "#f87171" },
    { name: "Lucro",   value: real.lucroPrevista,    color: "#34d399" },
  ];

  const topClientes = useMemo(() => {
    const m = new Map<string, { cliente: string; lucroAtual: number; lucroPrevisto: number; n: number }>();
    for (const p of filtrados) {
      const r = realizationOf(p);
      const cur = m.get(p.cliente_nome) ?? { cliente: p.cliente_nome, lucroAtual: 0, lucroPrevisto: 0, n: 0 };
      cur.lucroAtual    += r.lucroAtual;
      cur.lucroPrevisto += r.lucroPrevista;
      cur.n += 1;
      m.set(p.cliente_nome, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.lucroPrevisto - a.lucroPrevisto).slice(0, 5);
  }, [filtrados]);

  const tipMoney = (v: number) => brl(Number(v));
  const tipStyle = { background: "#ffffff", border: "1px solid #d1fae5", borderRadius: 10, padding: "8px 10px", boxShadow: "0 8px 20px -8px rgba(15,23,42,0.15)" };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-500 dark:text-neutral-400">
          <b className="text-emerald-700 dark:text-emerald-400">{pct(pctRealizado, 0)}</b> do pipeline já realizado · {filtrados.length} projeto(s) no período
        </div>
        <div className="w-48">
          <Label htmlFor="periodo">Período</Label>
          <GlassSelect id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
            {periodos.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </GlassSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DualKpi icon={WalletIcon} accent="sky"     label="Receita"  atual={real.receitaAtual}  previsto={real.receitaPrevista} />
        <DualKpi icon={Users}      accent="amber"   label="Comissão" atual={real.comissaoAtual} previsto={real.comissaoPrevista} />
        <DualKpi icon={Receipt}    accent="red"     label="Imposto"  atual={real.impostoAtual}  previsto={real.impostoPrevista} />
        <DualKpi icon={TrendingUp} accent="emerald" label="Lucro líquido" atual={real.lucroAtual} previsto={real.lucroPrevista} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Ticket médio</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{brl(ticketAtual)}</div>
          <div className="text-xs text-slate-400">Previsto {brl(ticketPrevisto)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Descartados</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{desc.count}</div>
          <div className="text-xs text-slate-400">{pct(taxaDescarte, 0)} dos leads · {brl(desc.valorPerdido)} perdidos</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400">Lucro previsto</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">{brl(real.lucroPrevista)}</div>
          <div className="text-xs text-slate-400">Realizado {brl(real.lucroAtual)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="xl:col-span-2 h-96">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Receita: realizada vs prevista por mês</div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-200"></span>Prevista</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>Atual</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={porMes} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gPrevista" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a7f3d0" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAtual" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} formatter={tipMoney} cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="receitaPrevista" name="Receita prevista" stroke="#a7f3d0" strokeWidth={2}   fill="url(#gPrevista)" animationDuration={900} />
              <Area type="monotone" dataKey="receitaAtual"    name="Receita atual"    stroke="#059669" strokeWidth={2.5} fill="url(#gAtual)"    animationDuration={1100} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="h-96">
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200 mb-2">Distribuição prevista</div>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie data={donut} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}
                   animationDuration={900} stroke="#ffffff" strokeWidth={3}>
                {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={tipMoney} contentStyle={tipStyle} />
              <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Pipeline por etapa</div>
          <div className="text-xs text-slate-500">Atual vs Previsto</div>
        </div>
        <div className="space-y-3">
          {porEtapa.length === 0 && <div className="text-sm text-slate-400">Sem dados.</div>}
          {porEtapa.map((e) => {
            const ratio = e.previsto > 0 ? (e.atual / e.previsto) * 100 : 0;
            const isPosVenda = POS_VENDA_STAGES.some((s) => s.label === e.etapa);
            return (
              <div key={e.etapa}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${isPosVenda ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"}`}>
                      {isPosVenda ? "Pós-venda" : "Vendas"}
                    </span>
                    <span className="text-slate-700 dark:text-neutral-200">{e.etapa}</span>
                    <span className="text-xs text-slate-400">· {e.n} projeto(s)</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{brl(e.atual)}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {brl(e.previsto)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-slate-200 dark:bg-neutral-700 rounded-full" style={{ width: "100%" }} />
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${ratio}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold text-slate-700 dark:text-neutral-200 mb-4">Top 5 clientes por lucro previsto</div>
        <div className="space-y-3">
          {topClientes.map((c, i) => {
            const max = topClientes[0]?.lucroPrevisto || 1;
            const wPrev = (c.lucroPrevisto / max) * 100;
            const wAtual = (c.lucroAtual / max) * 100;
            return (
              <div key={c.cliente}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-slate-700 dark:text-neutral-200">{c.cliente}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{brl(c.lucroAtual)}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {brl(c.lucroPrevisto)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-emerald-100 dark:bg-emerald-950/40 rounded-full" style={{ width: `${wPrev}%` }} />
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${wAtual}%` }} />
                </div>
              </div>
            );
          })}
          {topClientes.length === 0 && <div className="text-sm text-slate-400">Sem dados no período.</div>}
        </div>
      </GlassCard>
    </div>
  );
}

