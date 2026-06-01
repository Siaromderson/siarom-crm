import type { Prioridade, TaskStatus } from "@/types/database";
import type { Tone } from "@/lib/palette";

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
  /** Cor da categoria da tarefa (paleta). Quando presente, tem prioridade sobre `tone`. */
  colorTone?: Tone;
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
  /** Regra de recorrência da série. */
  recorrencia?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  /** Dias da semana (0=Dom..6=Sáb), só para weekly. */
  diasSemana?: number[] | null;
  /** Data fim da recorrência (yyyy-mm-dd) ou null = sem fim. */
  recorrenciaAte?: string | null;
}

/** Parse robusto: data-only "yyyy-mm-dd" vira meia-noite local (evita drift de UTC). */
export function parseEventoDate(s: string): Date {
  if (!s.includes("T")) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  return new Date(s);
}

/**
 * Filtra eventos relevantes para "hoje":
 * - tarefa/entrega/testes_fim/followup: inclui atrasados (data <= hoje)
 * - reuniao/evento: apenas hoje
 */
export function eventosDeHoje(eventos: AgendaEvento[]): AgendaEvento[] {
  const agora = new Date();
  const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
  const incluiAtrasados: AgendaTipo[] = ["tarefa", "entrega", "testes_fim", "followup"];
  return eventos
    .filter((ev) => {
      const d = parseEventoDate(ev.data);
      if (d > fimHoje) return false;
      if (incluiAtrasados.includes(ev.tipo)) return true;
      return (
        d.getFullYear() === agora.getFullYear() &&
        d.getMonth() === agora.getMonth() &&
        d.getDate() === agora.getDate()
      );
    })
    .sort((a, b) => a.data.localeCompare(b.data));
}
