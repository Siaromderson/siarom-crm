import { requireSession } from "@/lib/auth";
import { getAgendaEventos } from "@/lib/agenda";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { profile } = await requireSession();
  const eventos = await getAgendaEventos({ roleAdmin: profile.role === "admin", userId: profile.id });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold title-grad">Agenda</h1>
        <p className="text-sm text-slate-500">
          Tarefas com prazo, entregas, fim de testes, reuniões e follow-ups
        </p>
      </div>
      <AgendaClient eventos={eventos} />
    </div>
  );
}
