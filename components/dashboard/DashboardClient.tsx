"use client";
import { useMemo, useState } from "react";
import { GlassCard, GlassSelect, Label } from "@/components/ui/glass";
import { brl, pct } from "@/lib/format";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Wallet, Users, Receipt, TrendingUp, Briefcase, BarChart3, XCircle, type LucideIcon } from "lucide-react";
import { KANBAN_STAGES, POS_VENDA_STAGES, isDescartado, type Project } from "@/types/database";
import { REALIZATION_PCT, realizationOf, sumRealization, sumDescartados } from "@/lib/realization";

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

const ACCENTS: Record<string, { bar: string; icon: string; iconBg: string; ring: string; label: string; track: string; fill: string }> = {
  emerald: { bar: "bg-emerald-500", icon: "text-emerald-600", iconBg: "bg-emerald-50", ring: "ring-emerald-100", label: "text-emerald-700", track: "bg-emerald-100", fill: "from-emerald-400 to-emerald-600" },
  amber:   { bar: "bg-amber-500",   icon: "text-amber-600",   iconBg: "bg-amber-50",   ring: "ring-amber-100",   label: "text-amber-700",   track: "bg-amber-100",   fill: "from-amber-400 to-amber-600" },
  rose:    { bar: "bg-rose-500",    icon: "text-rose-600",    iconBg: "bg-rose-50",    ring: "ring-rose-100",    label: "text-rose-700",    track: "bg-rose-100",    fill: "from-rose-400 to-rose-600" },
  sky:     { bar: "bg-sky-500",     icon: "text-sky-600",     iconBg: "bg-sky-50",     ring: "ring-sky-100",     label: "text-sky-700",     track: "bg-sky-100",     fill: "from-sky-400 to-sky-600" },
  violet:  { bar: "bg-violet-500",  icon: "text-violet-600",  iconBg: "bg-violet-50",  ring: "ring-violet-100",  label: "text-violet-700",  track: "bg-violet-100",  fill: "from-violet-400 to-violet-600" },
  lime:    { bar: "bg-lime-500",    icon: "text-lime-600",    iconBg: "bg-lime-50",    ring: "ring-lime-100",    label: "text-lime-700",    track: "bg-lime-100",    fill: "from-lime-400 to-lime-600" },
};

/** KPI com Atual vs Previsto e barra de progresso */
function DualKpi({ icon: Icon, label, atual, previsto, accent }: {
  icon: LucideIcon;
  label: string; atual: number; previsto: number; accent: keyof typeof ACCENTS;
}) {
  const c = ACCENTS[accent];
  const ratio = previsto > 0 ? Math.min(100, (atual / previsto) * 100) : 0;
  return (
    <div className={`card p-5 relative overflow-hidden ring-4 ${c.ring}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} ${c.icon} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${c.label}`}>{label}</div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tabular-nums">{brl(atual)}</span>
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

function SimpleKpi({ icon: Icon, label, value, hint, accent }: {
  icon: LucideIcon;
  label: string; value: string; hint?: string; accent: keyof typeof ACCENTS;
}) {
  const c = ACCENTS[accent];
  return (
    <div className={`card p-5 relative overflow-hidden ring-4 ${c.ring}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${c.iconBg} ${c.icon} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${c.label}`}>{label}</div>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

export function DashboardClient({ projetos }: { projetos: Project[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("6m");
  const filtrados = useMemo(() => projetos.filter((p) => inRange(new Date(p.created_at), periodo)), [projetos, periodo]);

  const real = useMemo(() => sumRealization(filtrados), [filtrados]);
  const desc = useMemo(() => sumDescartados(filtrados), [filtrados]);
  const ativos = filtrados.filter((p) => !isDescartado(p.kanban_stage));
  const ticketAtual    = ativos.length ? real.receitaAtual    / ativos.length : 0;
  const ticketPrevista = ativos.length ? real.receitaPrevista / ativos.length : 0;
  const totalLeads = filtrados.length;
  const taxaDescarte = totalLeads > 0 ? (desc.count / totalLeads) * 100 : 0;

  /* Série mensal com atual e previsto */
  const porMes = useMemo(() => {
    const m = new Map<string, { mes: string; receitaAtual: number; receitaPrevista: number; lucroAtual: number; lucroPrevista: number }>();
    for (const p of filtrados) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const r = realizationOf(p);
      const cur = m.get(key) ?? { mes: key, receitaAtual: 0, receitaPrevista: 0, lucroAtual: 0, lucroPrevista: 0 };
      cur.receitaAtual    += r.receitaAtual;
      cur.receitaPrevista += r.receitaPrevista;
      cur.lucroAtual      += r.lucroAtual;
      cur.lucroPrevista   += r.lucroPrevista;
      m.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filtrados]);

  /* Composição por etapa do kanban (quanto há parado em cada fase) */
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
    { name: "Sócio",   value: real.comissaoPrevista, color: "#86efac" },
    { name: "Imposto", value: real.impostoPrevista,  color: "#34d399" },
    { name: "Lucro",   value: real.lucroPrevista,    color: "#059669" },
  ];

  const topClientes = useMemo(() => {
    const m = new Map<string, { cliente: string; lucroAtual: number; lucroPrevista: number; n: number }>();
    for (const p of filtrados) {
      const r = realizationOf(p);
      const cur = m.get(p.cliente_nome) ?? { cliente: p.cliente_nome, lucroAtual: 0, lucroPrevista: 0, n: 0 };
      cur.lucroAtual    += r.lucroAtual;
      cur.lucroPrevista += r.lucroPrevista;
      cur.n += 1;
      m.set(p.cliente_nome, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.lucroPrevista - a.lucroPrevista).slice(0, 5);
  }, [filtrados]);

  const tipMoney = (v: number) => brl(Number(v));
  const tipStyle = { background: "#ffffff", border: "1px solid #d1fae5", borderRadius: 10, padding: "8px 10px", boxShadow: "0 8px 20px -8px rgba(15,23,42,0.15)" };

  const pctRealizado = real.receitaPrevista > 0 ? (real.receitaAtual / real.receitaPrevista) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold title-grad">Dashboard</h1>
          <p className="text-sm text-slate-500">
            <b className="text-emerald-700">{pct(pctRealizado, 0)}</b> do pipeline já realizado · {filtrados.length} projeto(s) no período
          </p>
        </div>
        <div className="w-48">
          <Label htmlFor="periodo">Período</Label>
          <GlassSelect id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
            {periodos.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </GlassSelect>
        </div>
      </div>

      {/* KPIs Atual / Previsto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DualKpi icon={Wallet}     accent="sky"     label="Receita"  atual={real.receitaAtual}  previsto={real.receitaPrevista} />
        <DualKpi icon={Users}      accent="amber"   label="Comissão" atual={real.comissaoAtual} previsto={real.comissaoPrevista} />
        <DualKpi icon={Receipt}    accent="rose"    label="Imposto"  atual={real.impostoAtual}  previsto={real.impostoPrevista} />
        <DualKpi icon={TrendingUp} accent="emerald" label="Lucro líquido" atual={real.lucroAtual} previsto={real.lucroPrevista} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SimpleKpi icon={Briefcase} accent="violet" label="Leads ativos"
                   value={ativos.length.toString()}
                   hint={`${ativos.filter((p) => REALIZATION_PCT[p.kanban_stage] === 100).length} pagos · ${ativos.filter((p) => REALIZATION_PCT[p.kanban_stage] === 0).length} em prospecção`} />
        <SimpleKpi icon={BarChart3} accent="lime" label="Ticket médio"
                   value={brl(ticketAtual)} hint={`Previsto ${brl(ticketPrevista)}`} />
        <SimpleKpi icon={XCircle} accent="rose" label="Descartados"
                   value={desc.count.toString()}
                   hint={`${pct(taxaDescarte, 0)} dos leads · ${brl(desc.valorPerdido)} perdidos`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="xl:col-span-2 h-96">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-slate-700">Receita: realizada vs prevista por mês</div>
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
          <div className="text-sm font-semibold text-slate-700 mb-2">Distribuição prevista</div>
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

      {/* Funil — Pipeline por etapa */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-700">Pipeline por etapa do Kanban</div>
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
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${isPosVenda ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
                      {isPosVenda ? "Pós-venda" : "Vendas"}
                    </span>
                    <span className="text-slate-700">{e.etapa}</span>
                    <span className="text-xs text-slate-400">· {e.n} projeto(s)</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-emerald-600 font-semibold">{brl(e.atual)}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {brl(e.previsto)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-slate-200 rounded-full" style={{ width: "100%" }} />
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${ratio}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="h-96">
        <div className="text-sm font-semibold text-slate-700 mb-2">Composição por mês (realizado)</div>
        <ResponsiveContainer width="100%" height="88%">
          <BarChart data={porMes} margin={{ top: 10, right: 16, bottom: 0, left: 0 }} barCategoryGap={18}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={tipMoney} contentStyle={tipStyle} cursor={{ fill: "#ecfdf5" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="receitaAtual" name="Receita realizada" fill="#059669" radius={[8, 8, 0, 0]} animationDuration={1000} />
            <Bar dataKey="lucroAtual"   name="Lucro realizado"   fill="#34d399" radius={[8, 8, 0, 0]} animationDuration={1100} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard>
        <div className="text-sm font-semibold text-slate-700 mb-4">Top 5 clientes por lucro previsto</div>
        <div className="space-y-3">
          {topClientes.map((c, i) => {
            const max = topClientes[0]?.lucroPrevista || 1;
            const wPrev = (c.lucroPrevista / max) * 100;
            const wAtual = (c.lucroAtual / max) * 100;
            return (
              <div key={c.cliente}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-slate-700">{c.cliente}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-emerald-600 font-semibold">{brl(c.lucroAtual)}</span>
                    <span className="text-xs text-slate-400 ml-2">/ {brl(c.lucroPrevista)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-emerald-100 rounded-full" style={{ width: `${wPrev}%` }} />
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
