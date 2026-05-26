import { CalculadoraClient } from "@/components/calculadora/CalculadoraClient";
import { getDefaults } from "@/lib/actions/settings";

export default async function Page() {
  const defaults = await getDefaults();
  return <CalculadoraClient defaults={defaults} />;
}
