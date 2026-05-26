export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export const pct = (n: number, digits = 1) =>
  `${(n || 0).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}%`;

export const ymd = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
};

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
