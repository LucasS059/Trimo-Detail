import type { ChangeEvent } from "react";

export function normalizarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11 || digitos.length === 10) return `55${digitos}`;
  if (digitos.length === 13 && digitos.startsWith("55")) return digitos;
  return digitos;
}

export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}

export function normalizarContato(valor: string, canal: "whatsapp" | "email"): string {
  return canal === "whatsapp" ? normalizarTelefone(valor) : normalizarEmail(valor);
}

export function mascararTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  const final = digitos.slice(-4);
  return `(**) *****-${final}`;
}

export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return email;
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"*".repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
}

export function detectarCanal(valor: string): "whatsapp" | "email" {
  return valor.includes("@") ? "email" : "whatsapp";
}

/**
 * Formata progressivamente enquanto o usuário digita.
 * Trava em 11 dígitos (DDD + 9 dígitos) para nunca "quebrar" a máscara.
 */
export function aplicarMascaraTelefone(valor: string): string {
  // Remove todos os não-dígitos
  let digitos = valor.replace(/\D/g, "");

  // Se o usuário já forneceu o DDI do Brasil (55), remova antes de aplicar
  // a máscara local para evitar truncamento (ex.: 5511946629129).
  if (digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }

  digitos = digitos.slice(0, 11);

  if (digitos.length <= 2) return digitos.length ? `(${digitos}` : "";
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    // formato fixo: (00) 0000-0000
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  // formato celular: (00) 00000-0000
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/**
 * Handler de evento pronto para qualquer <input> de telefone.
 * Todo campo de telefone do app deve usar este handler — ponto único de manutenção.
 *
 * Uso: <input onChange={criarHandlerTelefone(setTelefone)} ... />
 */
export function criarHandlerTelefone(
  setValor: (valor: string) => void
): (e: ChangeEvent<HTMLInputElement>) => void {
  return (e) => setValor(aplicarMascaraTelefone(e.target.value));
}

/**
 * Handler de evento pronto para qualquer <input> de e-mail.
 * Só normaliza minúsculas/trim durante a digitação (sem mascarar visualmente).
 */
export function criarHandlerEmail(
  setValor: (valor: string) => void
): (e: ChangeEvent<HTMLInputElement>) => void {
  return (e) => setValor(e.target.value.toLowerCase());
}