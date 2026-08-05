export function normalizarPlaca(placa?: string | null): string | null {
  if (!placa) return null;

  const valor = placa.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
  return valor.length > 0 ? valor : null;
}
