const SEGREDO_SESSAO = process.env.AUTH_SECRET || process.env.SESSAO_ADMIN_SECRET || "trimo_secret_admin_default_key_2026";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export const COOKIE_SESSION_NAME = "trimo_session";

type PayloadLoja = {
  lojaId: string;
  exp: number;
};

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function gerarHmacSignature(dados: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dados));
  return base64UrlEncode(signature);
}

export async function assinarSessaoLoja(lojaId: string): Promise<string> {
  const payload: PayloadLoja = {
    lojaId,
    exp: Date.now() + DURACAO_MS,
  };
  const encoder = new TextEncoder();
  const dadosStr = JSON.stringify(payload);
  const dadosBase64 = base64UrlEncode(encoder.encode(dadosStr));
  const assinatura = await gerarHmacSignature(dadosBase64, SEGREDO_SESSAO);
  return `${dadosBase64}.${assinatura}`;
}

export async function verificarSessaoLoja(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;

  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [dadosBase64, assinatura] = partes;
  if (!dadosBase64 || !assinatura) return null;

  const assinaturaEsperada = await gerarHmacSignature(dadosBase64, SEGREDO_SESSAO);

  if (assinatura !== assinaturaEsperada) {
    return null;
  }

  try {
    const bytes = base64UrlDecode(dadosBase64);
    const decoder = new TextDecoder();
    const payload: PayloadLoja = JSON.parse(decoder.decode(bytes));
    if (!payload.lojaId || typeof payload.lojaId !== "string") return null;
    if (payload.exp < Date.now()) return null;
    return payload.lojaId;
  } catch {
    return null;
  }
}

