import type { Prioridade, TaskStatus } from "@/types/database";

export type AgendaTipo = "tarefa" | "entrega" | "testes_fim" | "reuniao" | "followup" | "evento";
export type AgendaTone = "blue" | "amber" | "red" | "green" | "purple" | "slate";

export interface AgendaEvento {
  id: string;
  tipo: AgendaTipo;
  data: string;          // ISO; data-only "yyyy-mm-dd" para all-day
  hasTime: boolean;
  titulo: string;
  contexto: string | null;
  tone: AgendaTone;
  href: string | null;
  prioridade?: Prioridade;
  status?: TaskStatus;
  /** Quando true, o chip abre o modal de edição em vez de navegar. */
  editavel?: boolean;
  /** ID do registro em siarom_crm_agenda_events (usado pelo modal de edição). */
  eventoDbId?: string;
  /** Descrição livre — exibida no modal de edição. */
  descricao?: string | null;
  /** Tipo armazenado no DB (reunião/tarefa/lembrete/outro). */
  eventoTipo?: "reuniao" | "tarefa" | "lembrete" | "outro";
}

/** Parse robusto: data-only "yyyy-mm-dd" vira meia-noite local (evita drift de UTC). */
export function parseEventoDate(s: string): Date {
  if (!s.includes("T")) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  return new Date(s);
}
