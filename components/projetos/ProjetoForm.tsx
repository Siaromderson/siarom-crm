"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, GlassButton, GlassInput, GlassSelect, GlassTextarea, Label } from "@/components/ui/glass";
import { ResumoCalculo } from "@/components/calculadora/ResumoCalculo";
import { calcularDivisao } from "@/lib/calc";
import { KANBAN_STAGES, type Project } from "@/types/database";
import { criarProjeto, atualizarProjeto, deletarProjeto } from "@/lib/actions/projects";

export function ProjetoForm({
  defaults,
  inicial,
}: {
  defaults: { comissao: number; imposto: number };
  inicial?: Project;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [cliente, setCliente] = useState(inicial?.cliente_nome ?? "");
  const [site, setSite] = useState(inicial?.site_url ?? "");
  const [tel, setTel] = useState(inicial?.telefone ?? "");
  const [desc, setDesc] = useState(inicial?.descricao_automacao ?? "");
  const [total, setTotal] = useState<number>(inicial?.valor_total ?? 0);
  const [com, setCom] = useState<number>(inicial?.taxa_comissao ?? defaults.comissao);
  const [imp, setImp] = useState<number>(inicial?.taxa_imposto ?? defaults.imposto);
  const [stage, setStage] = useState(inicial?.kanban_stage ?? "reuniao_agendada");

  const r = useMemo(() => calcularDivisao(total, com, imp), [total, com, imp]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const res = inicial ? await atualizarProjeto(inicial.id, fd) : await criarProjeto(fd);
      if (res?.error) return setErro(res.error);
      router.push("/projetos");
      router.refresh();
    });
  };

  const remover = () => {
    if (!inicial) return;
    if (!confirm("Excluir este projeto?")) return;
    start(async () => {
      const res = await deletarProjeto(inicial.id);
      if (res?.error) return setErro(res.error);
      router.push("/projetos");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard className="space-y-4">
        <div>
          <Label htmlFor="cliente_nome">Cliente</Label>
          <GlassInput id="cliente_nome" name="cliente_nome" required value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="site_url">Site</Label>
            <GlassInput id="site_url" name="site_url" type="url" placeholder="https://..." value={site} onChange={(e) => setSite(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <GlassInput id="telefone" name="telefone" placeholder="(11) 99999-9999" value={tel} onChange={(e) => setTel(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="descricao_automacao">Descrição da automação</Label>
          <GlassTextarea id="descricao_automacao" name="descricao_automacao" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="valor_total">Valor total (R$)</Label>
            <GlassInput id="valor_total" name="valor_total" type="number" min={0} step="0.01" value={total} onChange={(e) => setTotal(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="taxa_comissao">% Comissão</Label>
            <GlassInput id="taxa_comissao" name="taxa_comissao" type="number" min={0} max={100} step="0.1" value={com} onChange={(e) => setCom(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="taxa_imposto">% Imposto</Label>
            <GlassInput id="taxa_imposto" name="taxa_imposto" type="number" min={0} max={100} step="0.1" value={imp} onChange={(e) => setImp(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div>
          <Label htmlFor="kanban_stage">Etapa Kanban</Label>
          <GlassSelect id="kanban_stage" name="kanban_stage" value={stage} onChange={(e) => setStage(e.target.value as Project["kanban_stage"])}>
            {KANBAN_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </GlassSelect>
        </div>

        {erro && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-md p-2">{erro}</div>}

        <div className="flex gap-3 pt-2">
          <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : inicial ? "Salvar" : "Criar projeto"}</GlassButton>
          {inicial && <GlassButton type="button" variant="danger" onClick={remover} disabled={pending}>Excluir</GlassButton>}
          <GlassButton type="button" variant="ghost" onClick={() => router.back()}>Cancelar</GlassButton>
        </div>
      </GlassCard>

      <div>
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Preview do cálculo</div>
        <ResumoCalculo r={r} />
      </div>
    </form>
  );
}
