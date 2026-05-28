import type { Mentoria, MentoriaAula } from "@/types/database";

export interface MentoriaResumo {
  horasUsadas: number;
  horasRestantes: number;
  pctUsado: number;
  imposto: number;
  lucro: number;
}

export function resumoMentoria(m: Mentoria, aulas: MentoriaAula[]): MentoriaResumo {
  const horasUsadas = aulas.reduce((a, x) => a + Number(x.duracao_horas), 0);
  const contratadas = Number(m.horas_contratadas);
  const horasRestantes = contratadas - horasUsadas;
  const pctUsado = contratadas > 0 ? Math.min(100, (horasUsadas / contratadas) * 100) : 0;
  const valor = Number(m.valor_total);
  const imposto = valor * (Number(m.taxa_imposto) / 100);
  const lucro = valor - imposto;
  return { horasUsadas, horasRestantes, pctUsado, imposto, lucro };
}

/** Soma financeira de todas as mentorias (receita, imposto, lucro). */
export function somaFinanceiraMentorias(mentorias: Mentoria[]) {
  return mentorias.reduce(
    (acc, m) => {
      const valor = Number(m.valor_total);
      const imposto = valor * (Number(m.taxa_imposto) / 100);
      acc.receita += valor;
      acc.imposto += imposto;
      acc.lucro += valor - imposto;
      return acc;
    },
    { receita: 0, imposto: 0, lucro: 0 }
  );
}

export const fmtHoras = (h: number) => {
  const v = Math.round(h * 100) / 100;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}h`;
};
