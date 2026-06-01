/**
 * Paleta de cores SUTIS compartilhada.
 *
 * - `toneChip`  → fundo claro + texto + borda (chips da agenda, badges de categoria).
 * - `toneDot`   → bolinha sólida (indicador de cor no card / no seletor).
 * - `toneColumn`→ fundo bem fraco para o cabeçalho das colunas do Kanban.
 * - `toneBar`   → barrinha de destaque (topo da coluna / lateral do card).
 *
 * Todas as classes são escritas por extenso para o Tailwind não removê-las no build.
 */
import type { KanbanStage, TaskCategoria, TaskStatus } from "@/types/database";

export type Tone =
  | "emerald" | "sky" | "violet" | "amber" | "rose"
  | "teal" | "orange" | "indigo" | "pink" | "slate";

export const TONE_LIST: { id: Tone; label: string; hex: string }[] = [
  { id: "emerald", label: "Verde",   hex: "#10b981" },
  { id: "sky",     label: "Azul",    hex: "#0ea5e9" },
  { id: "violet",  label: "Violeta", hex: "#8b5cf6" },
  { id: "amber",   label: "Âmbar",   hex: "#f59e0b" },
  { id: "rose",    label: "Rosa",    hex: "#f43f5e" },
  { id: "teal",    label: "Turquesa", hex: "#14b8a6" },
  { id: "orange",  label: "Laranja", hex: "#f97316" },
  { id: "indigo",  label: "Índigo",  hex: "#6366f1" },
  { id: "pink",    label: "Pink",    hex: "#ec4899" },
  { id: "slate",   label: "Cinza",   hex: "#64748b" },
];

export const toneChip: Record<Tone, string> = {
  emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  sky:     "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900",
  violet:  "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900",
  amber:   "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  rose:    "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
  teal:    "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900",
  orange:  "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900",
  indigo:  "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900",
  pink:    "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-900",
  slate:   "bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700",
};

export const toneDot: Record<Tone, string> = {
  emerald: "bg-emerald-500", sky: "bg-sky-500", violet: "bg-violet-500",
  amber: "bg-amber-500", rose: "bg-rose-500", teal: "bg-teal-500",
  orange: "bg-orange-500", indigo: "bg-indigo-500", pink: "bg-pink-500", slate: "bg-slate-400",
};

/** Fundo bem fraco para o cabeçalho das colunas do Kanban (etapas). */
export const toneColumn: Record<Tone, string> = {
  emerald: "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/60",
  sky:     "bg-sky-50/60 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-900/60",
  violet:  "bg-violet-50/60 dark:bg-violet-950/20 border-violet-200/70 dark:border-violet-900/60",
  amber:   "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/60",
  rose:    "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/60",
  teal:    "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/70 dark:border-teal-900/60",
  orange:  "bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/60",
  indigo:  "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-900/60",
  pink:    "bg-pink-50/60 dark:bg-pink-950/20 border-pink-200/70 dark:border-pink-900/60",
  slate:   "bg-slate-100/60 dark:bg-neutral-900/40 border-slate-200/70 dark:border-neutral-800",
};

/** Barrinha de destaque sólida e fina (topo da coluna). */
export const toneBar: Record<Tone, string> = {
  emerald: "bg-emerald-400", sky: "bg-sky-400", violet: "bg-violet-400",
  amber: "bg-amber-400", rose: "bg-rose-400", teal: "bg-teal-400",
  orange: "bg-orange-400", indigo: "bg-indigo-400", pink: "bg-pink-400", slate: "bg-slate-300",
};

/** Cores PADRÃO de cada categoria de tarefa (o admin pode trocar em Configurações). */
export const DEFAULT_CATEGORIA_CORES: Record<TaskCategoria, Tone> = {
  projeto: "sky",
  comunidade: "violet",
  gravacao: "orange",
};

/** Tons SUTIS por etapa do Kanban de TAREFAS. */
export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  a_fazer: "slate",
  em_andamento: "sky",
  testar: "amber",
  validar: "violet",
  concluido: "emerald",
};

/** Tons SUTIS por etapa do Kanban de PROJETOS (e demais funis). */
export const KANBAN_STAGE_TONE: Record<KanbanStage, Tone> = {
  reuniao_agendada: "violet",
  geracao_proposta: "sky",
  proposta_enviada: "sky",
  geracao_contrato: "indigo",
  contrato_assinado: "indigo",
  pagamento_entrada: "teal",
  kickoff: "amber",
  implementacao: "amber",
  finalizado: "emerald",
  fase_testes: "orange",
  aguardando_pagamento_final: "teal",
  pagamento_final: "emerald",
  no_show: "rose",
  desqualificado: "slate",
  perdido: "rose",
};
