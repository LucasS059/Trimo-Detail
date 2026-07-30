/** Formata numéricos em moeda BRL nativa garantindo separador de milhar correto. */
export function formatarMoeda(valor: number | string): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  if (isNaN(numero)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

/** Formata a duração de minutos em string amigável. */
export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h ${m.toString().padStart(2, "0")}min`;
}