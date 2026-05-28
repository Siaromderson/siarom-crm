import { isDescartado, type KanbanStage, type Project } from "@/types/database";

/** Percentual do valor já recebido conforme a etapa do kanban. */
export const REALIZATION_PCT: Record<KanbanStage, number> = {
  // funil de vendas — nada recebido até a entrada
  reuniao_agendada: 0,
  geracao_proposta: 0,
  proposta_enviada: 0,
  geracao_contrato: 0,
  contrato_assinado: 0,
  pagamento_entrada: 50,
  // pós-venda — entrada já caiu (50%) até o pagamento final
  kickoff: 50,
  implementacao: 50,
  finalizado: 50,
  fase_testes: 50,
  aguardando_pagamento_final: 50,
  pagamento_final: 100,
  // descartados — nada realizado, e não somam ao pipeline previsto
  no_show: 0,
  desqualificado: 0,
  perdido: 0,
};

export interface ProjectRealization {
  receitaAtual: number; receitaPrevista: number;
  comissaoAtual: number; comissaoPrevista: number;
  impostoAtual: number; impostoPrevista: number;
  lucroAtual: number; lucroPrevista: number;
}

export function realizationOf(p: Project) {
  const pctR = REALIZATION_PCT[p.kanban_stage] / 100;
  return {
    receitaAtual:   Number(p.valor_total)    * pctR,
    receitaPrevista: Number(p.valor_total),
    comissaoAtual:   Number(p.valor_comissao) * pctR,
    comissaoPrevista: Number(p.valor_comissao),
    impostoAtual:    Number(p.valor_imposto)  * pctR,
    impostoPrevista:  Number(p.valor_imposto),
    lucroAtual:      Number(p.valor_lucro)    * pctR,
    lucroPrevista:    Number(p.valor_lucro),
  };
}

/** Soma apenas projetos ativos (exclui descartados). */
export function sumRealization(projetos: Project[]): ProjectRealization {
  return projetos.filter((p) => !isDescartado(p.kanban_stage)).reduce<ProjectRealization>((acc, p) => {
    const r = realizationOf(p);
    acc.receitaAtual    += r.receitaAtual;
    acc.receitaPrevista += r.receitaPrevista;
    acc.comissaoAtual   += r.comissaoAtual;
    acc.comissaoPrevista+= r.comissaoPrevista;
    acc.impostoAtual    += r.impostoAtual;
    acc.impostoPrevista += r.impostoPrevista;
    acc.lucroAtual      += r.lucroAtual;
    acc.lucroPrevista   += r.lucroPrevista;
    return acc;
  }, { receitaAtual: 0, receitaPrevista: 0, comissaoAtual: 0, comissaoPrevista: 0, impostoAtual: 0, impostoPrevista: 0, lucroAtual: 0, lucroPrevista: 0 });
}

/** Valor que foi perdido (receita potencial de projetos descartados). */
export function sumDescartados(projetos: Project[]) {
  const descartados = projetos.filter((p) => isDescartado(p.kanban_stage));
  const valorPerdido = descartados.reduce((a, p) => a + Number(p.valor_total), 0);
  const lucroPerdido = descartados.reduce((a, p) => a + Number(p.valor_lucro), 0);
  return { count: descartados.length, valorPerdido, lucroPerdido, projetos: descartados };
}
