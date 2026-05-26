export interface DivisaoResultado {
  total: number;
  comissao: number;
  imposto: number;
  lucro: number;
  pctComissao: number;
  pctImposto: number;
  pctLucro: number;
}

export function calcularDivisao(
  total: number,
  pctComissao = 20,
  pctImposto = 15.5
): DivisaoResultado {
  const t = Number.isFinite(total) ? total : 0;
  const comissao = +(t * (pctComissao / 100)).toFixed(2);
  const imposto = +(t * (pctImposto / 100)).toFixed(2);
  const lucro = +(t - comissao - imposto).toFixed(2);
  return {
    total: t,
    comissao,
    imposto,
    lucro,
    pctComissao,
    pctImposto,
    pctLucro: t > 0 ? (lucro / t) * 100 : 0,
  };
}
