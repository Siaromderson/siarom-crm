/** Calcula info da fase de testes: data fim, dias restantes, status. */
export interface FaseTestesInfo {
  fimEm: Date;
  diasRestantes: number;
  /** 'ativo' (em curso), 'encerrado' (atingiu o prazo), 'atrasado' (passou). */
  status: "ativo" | "encerrado" | "atrasado";
  label: string;
}

export function calcFaseTestes(inicio: string | null | undefined, diasTotais: number | null | undefined): FaseTestesInfo | null {
  if (!inicio || !diasTotais || diasTotais <= 0) return null;
  const start = new Date(inicio);
  const end = new Date(start);
  end.setDate(end.getDate() + diasTotais);
  const now = new Date();
  const msPorDia = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((end.getTime() - now.getTime()) / msPorDia);
  let status: FaseTestesInfo["status"];
  let label: string;
  if (diff > 0) {
    status = "ativo";
    label = `${diff} ${diff === 1 ? "dia restante" : "dias restantes"}`;
  } else if (diff === 0) {
    status = "ativo";
    label = "Termina hoje";
  } else {
    status = "atrasado";
    label = `${Math.abs(diff)} ${Math.abs(diff) === 1 ? "dia atrasado" : "dias atrasados"}`;
  }
  return { fimEm: end, diasRestantes: diff, status, label };
}

export const fmtData = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export interface PrazoInfo {
  fimEm: Date;
  diasRestantes: number;
  status: "ok" | "proximo" | "hoje" | "atrasado";
  label: string;
}

/** Calcula info do prazo de entrega a partir de uma data ISO/date (yyyy-mm-dd). */
export function calcPrazoEntrega(prazo: string | null | undefined): PrazoInfo | null {
  if (!prazo) return null;
  const end = new Date(prazo.length <= 10 ? `${prazo}T23:59:59` : prazo);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const msPorDia = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((end.getTime() - now.getTime()) / msPorDia);
  let status: PrazoInfo["status"];
  let label: string;
  if (diff < 0) {
    status = "atrasado";
    const n = Math.abs(diff);
    label = `${n} ${n === 1 ? "dia atrasado" : "dias atrasados"}`;
  } else if (diff === 0) {
    status = "hoje";
    label = "Entrega hoje";
  } else if (diff <= 3) {
    status = "proximo";
    label = `Faltam ${diff} ${diff === 1 ? "dia" : "dias"}`;
  } else {
    status = "ok";
    label = `Faltam ${diff} dias`;
  }
  return { fimEm: end, diasRestantes: diff, status, label };
}
