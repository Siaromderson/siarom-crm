/**
 * Convenção GLOBAL de cores para valores monetários no CRM.
 * Sempre que aparecer Sócio (comissão), Imposto ou Lucro, usar essas classes.
 * Tons sutis (50/200/600/700) — nunca cores saturadas tipo bg-amber-500.
 */
export const MONEY_TONES = {
  socio: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    chartFill: "#fbbf24",   // amber-400
    chartStroke: "#d97706", // amber-600
  },
  imposto: {
    text: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900",
    chartFill: "#f87171",   // red-400
    chartStroke: "#dc2626", // red-600
  },
  lucro: {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    chartFill: "#34d399",   // emerald-400
    chartStroke: "#059669", // emerald-600
  },
} as const;
