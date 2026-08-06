import { cookies } from "next/headers";
import crypto from "crypto";

const SEGREDO = process.env.SESSAO_CLIENTE_SECRET as string || "chave_temporaria_segura";
const DURACAO_MS = 24 * 60 * 60 * 1000;

type PayloadSessao = { contato: string; slug: string; exp: number };

function assinar(payload: PayloadSessao): string {
  const dados = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const assinatura = crypto.createHmac("sha256", SEGREDO).update(dados).digest("base64url");
  return `${dados}.${assinatura}`;
}

function verificar(token: string): PayloadSessao | null {
  const [dados, assinatura] = token.split(".");
  if (!dados || !assinatura) return null;

  const assinaturaEsperada = crypto.createHmac("sha256", SEGREDO).update(dados).digest("base64url");
  
  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinaturaEsperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const payload: PayloadSessao = JSON.parse(Buffer.from(dados, "base64url").toString());
  if (payload.exp < Date.now()) return null;

  return payload;
}

export async function criarSessaoCliente(contato: string, slug: string) {
  const token = assinar({ contato, slug, exp: Date.now() + DURACAO_MS });
  const store = await cookies();
  store.set(`sessao_cliente_${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURACAO_MS / 1000,
    path: "/",
  });
}

export async function obterContatoDaSessao(slug: string): Promise<string | null> {
  const store = await cookies();
  const token = store.get(`sessao_cliente_${slug}`)?.value;
  if (!token) return null;

  const payload = verificar(token);
  if (!payload || payload.slug !== slug) return null;

  return payload.contato;
}

export async function destruirSessaoCliente(slug: string) {
  const store = await cookies();
  store.set(`sessao_cliente_${slug}`, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// Alias exigido pelas actions de verificação / clientes
export async function encerrarSessaoCliente(slug: string) {
  return destruirSessaoCliente(slug);
}