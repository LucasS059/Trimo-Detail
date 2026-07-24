import { pool } from "./client";

export type FormaPagamento = "pix" | "point" | "manual";

export async function criarPagamentoPendente(dados: {
  agendamentoId: string;
  forma: FormaPagamento;
  formaManualDetalhe?: string;
  valor: number;
  mercadopagoPaymentId?: string;
  qrCodeBase64?: string;
  copiaECola?: string;
  expiraEm?: Date;
}) {
  const { rows } = await pool.query(
    `INSERT INTO pagamentos
       (agendamento_id, forma, forma_manual_detalhe, valor, mercadopago_payment_id, qr_code_base64, copia_e_cola, expira_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      dados.agendamentoId,
      dados.forma,
      dados.formaManualDetalhe ?? null,
      dados.valor,
      dados.mercadopagoPaymentId ?? null,
      dados.qrCodeBase64 ?? null,
      dados.copiaECola ?? null,
      dados.expiraEm?.toISOString() ?? null,
    ]
  );
  return rows[0].id as string;
}

/** Busca um Pix pendente e ainda válido pro agendamento — evita gerar cobrança duplicada. */
export async function buscarPixPendentePorAgendamento(agendamentoId: string) {
  const { rows } = await pool.query(
    `SELECT id, mercadopago_payment_id, qr_code_base64, copia_e_cola, expira_em, valor
     FROM pagamentos
     WHERE agendamento_id = $1
       AND forma = 'pix'
       AND status = 'pendente'
       AND (expira_em IS NULL OR expira_em > now())
     ORDER BY created_at DESC
     LIMIT 1`,
    [agendamentoId]
  );
  return rows[0] ?? null;
}

export async function confirmarPagamento(id: string) {
  await pool.query(
    `UPDATE pagamentos SET status = 'confirmado', confirmado_em = now() WHERE id = $1`,
    [id]
  );
}

/** Idempotente: só confirma se ainda estiver 'pendente', pra suportar reenvio de webhook. */
export async function confirmarPagamentoPorMercadoPagoId(mercadopagoPaymentId: string) {
  const { rows } = await pool.query(
    `UPDATE pagamentos
     SET status = 'confirmado', confirmado_em = now()
     WHERE mercadopago_payment_id = $1
       AND status = 'pendente'
     RETURNING id, agendamento_id`,
    [mercadopagoPaymentId]
  );
  return rows[0] ?? null;
}

/** Descobre a loja (e o token dela) a partir do payment_id — essencial pro webhook multi-tenant. */
export async function buscarLojaPorMercadoPagoPaymentId(mercadopagoPaymentId: string) {
  const { rows } = await pool.query(
    `SELECT p.id AS pagamento_id, p.agendamento_id, l.mercadopago_access_token
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     JOIN lojas l ON l.id = a.loja_id
     WHERE p.mercadopago_payment_id = $1`,
    [mercadopagoPaymentId]
  );
  return rows[0] ?? null;
}

export async function registrarBaixaManual(dados: {
  agendamentoId: string;
  valor: number;
  detalhe: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em)
     VALUES ($1, 'manual', $2, $3, 'confirmado', now())
     RETURNING id`,
    [dados.agendamentoId, dados.detalhe, dados.valor]
  );
  return rows[0].id as string;
}

export async function resumoFinanceiro(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT p.forma, COALESCE(SUM(p.valor), 0) AS total
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1
       AND p.status = 'confirmado'
       AND p.confirmado_em BETWEEN $2 AND $3
     GROUP BY p.forma`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  const { rows: emAberto } = await pool.query(
    `SELECT COALESCE(SUM(a.valor), 0) AS total
     FROM agendamentos a
     WHERE a.loja_id = $1
       AND a.status = 'aguardando_pagamento'`,
    [lojaId]
  );

  return {
    porForma: rows as { forma: string; total: string }[],
    totalEmAberto: emAberto[0].total as string,
  };
}