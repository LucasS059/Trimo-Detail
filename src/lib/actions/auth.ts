"use server";
// lib/actions/auth.ts

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { buscarLojaPorEmail } from "@/lib/db/lojas";
import { assinarSessaoLoja, verificarSessaoLoja, COOKIE_SESSION_NAME } from "@/lib/auth/sessao-loja";

export async function autenticar(params: { email: string; senha: string }) {
  const lojaUsuario = await buscarLojaPorEmail(params.email);
  if (!lojaUsuario) throw new Error("E-mail ou senha inválidos");

  const senhaValida = await bcrypt.compare(params.senha, lojaUsuario.senha_hash);
  if (!senhaValida) throw new Error("E-mail ou senha inválidos");

  const token = await assinarSessaoLoja(lojaUsuario.id);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESSION_NAME);
}

/** Usado pelas páginas do admin para saber qual loja (tenant) está logada com validação HMAC. */
export async function obterLojaLogadaId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESSION_NAME)?.value;
  return verificarSessaoLoja(token);
}

export async function obterContatoDaSessao(slug: string): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(`sessao_cliente_${slug}`)?.value;
  if (!token) return null;
  return null;
}