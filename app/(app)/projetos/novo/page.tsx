import { ProjetoForm } from "@/components/projetos/ProjetoForm";
import { getDefaults } from "@/lib/actions/settings";

export default async function Page() {
  const defaults = await getDefaults();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo projeto</h1>
      <ProjetoForm defaults={defaults} />
    </div>
  );
}
