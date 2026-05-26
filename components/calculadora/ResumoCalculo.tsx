"use client";
import { GlassCard } from "@/components/ui/glass";
import { brl, pct } from "@/lib/format";
import type { DivisaoResultado } from "@/lib/calc";

export function ResumoCalculo({ r }: { r: DivisaoResultado }) {
  const tiles = [
    { label: "Valor total", v: brl(r.total), p: "100%", value: "text-slate-900" },
    { label: `Sócio (${pct(r.pctComissao)})`, v: brl(r.comissao), p: pct(r.pctComissao), value: "text-slate-900" },
    { label: `Imposto (${pct(r.pctImposto)})`, v: brl(r.imposto), p: pct(r.pctImposto), value: "text-slate-900" },
    { label: "Seu lucro", v: brl(r.lucro), p: pct(r.pctLucro), value: "text-emerald-600" },
  ];

  const total = r.total || 1;
  const partes = [
    { w: (r.comissao / total) * 100, c: "bg-amber-400" },
    { w: (r.imposto / total) * 100, c: "bg-red-400" },
    { w: (r.lucro / total) * 100, c: "bg-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <GlassCard key={t.label}>
            <div className="text-xs text-slate-500">{t.label}</div>
            <div className={`text-2xl font-semibold mt-2 ${t.value}`}>{t.v}</div>
            <div className="text-xs text-slate-400 mt-1">{t.p} do total</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Distribuição</div>
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 border border-emerald-100">
          {partes.map((p, i) => (
            <div key={i} className={p.c} style={{ width: `${Math.max(0, p.w)}%` }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-3">
          <span><span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-2"></span>Sócio</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-red-400 mr-2"></span>Imposto</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-emerald-400 mr-2"></span>Lucro</span>
        </div>
      </GlassCard>
    </div>
  );
}
