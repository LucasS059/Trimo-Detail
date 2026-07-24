const MP_API_BASE = "https://api.mercadopago.com";

export type CobrancaPix = {
  mercadopagoPaymentId: string;
  qrCodeBase64: string;
  copiaECola: string;
  expiraEm: Date;
};

/**
 * Cria uma cobrança Pix no Mercado Pago.
 * Cada chamada gera um pagamento novo — o controle de reaproveitamento
 * (não gerar Pix duplicado) é feito ANTES de chamar essa função,
 * em finalizarComPix (lib/actions/agendamentos.ts).
 */
export async function gerarCobrancaPix(dados: {
  valor: number;
  descricao: string;
  emailPagador: string;
  accessToken: string;
}): Promise<CobrancaPix> {
  const dataExpiracao = new Date(Date.now() + 30 * 60 * 1000);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dados.accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(dados.valor.toFixed(2)),
        description: dados.descricao,
        payment_method_id: "pix",
        payer: { email: dados.emailPagador },
        date_of_expiration: dataExpiracao.toISOString(),
        // precisa bater com app/api/mercadopago/webhook/route.ts
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      }),
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Tempo esgotado ao conectar com o Mercado Pago. Tente novamente.");
    }
    throw error;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const corpoErro = await response.text();
    console.error("Erro do Mercado Pago ao criar Pix:", response.status, corpoErro);
    throw new Error("Falha ao gerar cobrança Pix. Verifique as credenciais do Mercado Pago.");
  }

  const json = await response.json();

  const qrCodeBase64: string | undefined = json.point_of_interaction?.transaction_data?.qr_code_base64;
  const copiaECola: string | undefined = json.point_of_interaction?.transaction_data?.qr_code;
  const expiraEmRetornado: string | undefined = json.date_of_expiration;

  if (!qrCodeBase64 || !copiaECola) {
    console.error("Resposta do Mercado Pago sem dados de QR code:", json);
    throw new Error("O Mercado Pago não retornou os dados do Pix. Tente novamente.");
  }

  return {
    mercadopagoPaymentId: String(json.id),
    qrCodeBase64,
    copiaECola,
    expiraEm: expiraEmRetornado ? new Date(expiraEmRetornado) : dataExpiracao,
  };
}

/** Busca o pagamento direto na API do Mercado Pago — usado pelo webhook pra confirmar antes de aceitar. */
export async function consultarPagamento(paymentId: string, accessToken: string) {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar pagamento ${paymentId} no Mercado Pago`);
  }

  return response.json();
}