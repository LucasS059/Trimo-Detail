import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { consultarPagamento } from "@/lib/mercadopago/client";
import {
  confirmarPagamentoPorMercadoPagoId,
  buscarLojaPorMercadoPagoPaymentId,
} from "@/lib/db/pagamentos";

/**
 * Valida a assinatura do webhook do Mercado Pago (header x-signature).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/webhooks
 */
function validarAssinatura(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET não configurado — pulando validação de assinatura.");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const partes = xSignature.split(",").reduce((acc, parte) => {
    const [chave, valor] = parte.split("=");
    acc[chave.trim()] = valor?.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = partes.ts;
  const hashRecebido = partes.v1;
  if (!ts || !hashRecebido) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hashCalculado = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hashCalculado), Buffer.from(hashRecebido));
  } catch {
    return false; // tamanhos diferentes de buffer, por ex.
  }
}

/**
 * O Mercado Pago chama essa rota sempre que o status de um pagamento muda
 * (Pix pago, Point aprovado, etc.). Tratamos "approved": confirmamos no
 * nosso banco e movemos o agendamento para "concluído" automaticamente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const mercadopagoPaymentId = String(body.data?.id ?? "");
    if (!mercadopagoPaymentId) {
      return NextResponse.json({ ok: true });
    }

    if (!validarAssinatura(request, mercadopagoPaymentId)) {
      console.warn("Webhook com assinatura inválida, ignorando.", { mercadopagoPaymentId });
      return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
    }

    // Descobre a loja dona do pagamento pra consultar com o token certo (multi-tenant)
    const lojaId = await buscarLojaPorMercadoPagoPaymentId(mercadopagoPaymentId);
    if (!lojaId) {
      return NextResponse.json({ ok: true });
    }

    // Como os tokens do MP agora ficam na tabela loja_integracoes, buscamos de forma segura
    const { pool } = await import("@/lib/db/client");
    const { rows: intRows } = await pool.query(
      `SELECT mercadopago_access_token FROM loja_integracoes WHERE loja_id = $1`,
      [lojaId]
    );
    const accessToken = intRows[0]?.mercadopago_access_token;

    if (!accessToken) {
      return NextResponse.json({ ok: true });
    }

    const pagamentoRemoto = await consultarPagamento(
      mercadopagoPaymentId,
      accessToken
    );

    if (pagamentoRemoto.status === "approved") {
      // Passa o ID e o objeto vazio de detalhes (já que o webhook apenas confirma o status aprovado)
      await confirmarPagamentoPorMercadoPagoId(mercadopagoPaymentId, {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    return NextResponse.json({ ok: true }); // 200 evita retry storm; erro já logado
  }
}