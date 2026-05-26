"use client";
import { useState, useMemo } from "react";
import { GlassCard, GlassInput, Label } from "@/components/ui/glass";
import { calcularDivisao } from "@/lib/calc";
import { ResumoCalculo } from "./ResumoCalculo";

export function CalculadoraClient({ defaults }: { defaults: { comissao: number; imposto: number } }) {
  const [total, setTotal] = useState<number>(10000);
  const [com, setCom] = useState<number>(defaults.comissao);
  const [imp, setImp] = useState<number>(defaults.imposto);

  const r = useMemo(() => calcularDivisao(total, com, imp), [total, com, imp]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold title-grad">Calculadora de aquisição</h1>
        <p className="text-sm text-slate-500">Simule comissão, imposto e lucro líquido de um projeto.</p>
      </div>

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="total">Valor total (R$)</Label>
            <GlassInput id="total" type="number" min={0} step="0.01" value={total} onChange={(e) => setTotal(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="com">% Comissão sócio</Label>
            <GlassInput id="com" type="number" min={0} max={100} step="0.1" value={com} onChange={(e) => setCom(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="imp">% Imposto</Label>
            <GlassInput id="imp" type="number" min={0} max={100} step="0.1" value={imp} onChange={(e) => setImp(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      </GlassCard>

      <ResumoCalculo r={r} />
    </div>
  );
}
