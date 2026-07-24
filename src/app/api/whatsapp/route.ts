// app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Callback do provedor de WhatsApp (ex: confirmação de entrega de mensagem,
 * ou resposta do cliente a um botão). A implementação exata depende do
 * provedor escolhido (Z-API, Twilio, Meta Business API) — por enquanto só
 * loga o payload recebido.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("[whatsapp webhook] payload recebido:", body);

  return NextResponse.json({ ok: true });
}
