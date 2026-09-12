// lib/tema-loja.ts

/** Cor de marca padrão usada quando a loja não configurou nenhuma. */
export const COR_MARCA_PADRAO = "#E56B25";

/** Retorna a cor de marca da loja (ou o fallback padrão), pronta pra usar em style inline. */
export function corMarca(cor_primaria?: string | null): string {
  return cor_primaria || COR_MARCA_PADRAO;
}

/** Objeto de style pronto pra aplicar a CSS variable --brand em qualquer container. */
export function estiloTemaLoja(cor_primaria?: string | null): React.CSSProperties {
  return { ["--brand" as any]: corMarca(cor_primaria) };
}