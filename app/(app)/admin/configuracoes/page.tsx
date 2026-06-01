import { requireAdmin } from "@/lib/auth";
import { getDefaults, salvarDefaults, getCategoriaCores } from "@/lib/actions/settings";
import { GlassCard, GlassButton, GlassInput, Label } from "@/components/ui/glass";
import { CategoriaCoresForm } from "@/components/admin/CategoriaCoresForm";

export default async function Page() {
  await requireAdmin();
  const defaults = await getDefaults();
  const categoriaCores = await getCategoriaCores();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold title-grad">Configurações</h1>
        <p className="text-sm text-slate-500">Valores padrão usados pela calculadora e novos projetos.</p>
      </div>
      <GlassCard>
        <form action={async (fd) => { "use server"; await salvarDefaults(fd); }} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="comissao">% Comissão padrão</Label>
              <GlassInput id="comissao" name="comissao" type="number" min={0} max={100} step="0.1" defaultValue={defaults.comissao} />
            </div>
            <div>
              <Label htmlFor="imposto">% Imposto padrão</Label>
              <GlassInput id="imposto" name="imposto" type="number" min={0} max={100} step="0.1" defaultValue={defaults.imposto} />
            </div>
          </div>
          <GlassButton type="submit">Salvar</GlassButton>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-neutral-100">Cores dos tipos de tarefa</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Cor usada para diferenciar cada tipo no Kanban de tarefas e na Agenda.
          </p>
        </div>
        <CategoriaCoresForm inicial={categoriaCores} />
      </GlassCard>
    </div>
  );
}
