"use server";
// lib/actions/auth.ts

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { buscarLojaPorEmail } from "@/lib/db/lojas";

const COOKIE_NOME = "trimo_session";

export async function autenticar(params: { email: string; senha: string }) {
  const lojaUsuario = await buscarLojaPorEmail(params.email);
  if (!lojaUsuario) throw new Error("E-mail ou senha inválidos");

  const senhaValida = await bcrypt.compare(params.senha, lojaUsuario.senha_hash);
  if (!senhaValida) throw new Error("E-mail ou senha inválidos");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NOME, lojaUsuario.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NOME);
}

/** Usado pelas páginas do admin para saber qual loja (tenant) está logada. */
export async function obterLojaLogadaId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NOME)?.value ?? null;
}

export async function obterContatoDaSessao(slug: string): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(`sessao_cliente_${slug}`)?.value;
  if (!token) return null;
  return null;
}