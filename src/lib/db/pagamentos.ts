import { pool } from "./client";

export async function registrarBaixaManual(dados: { agendamentoId: string; valor: number; detalhe: string }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em)
       VALUES ($1, 'manual', $2::jsonb, $3, 'confirmado', now())
       RETURNING id, codigo`,
      [dados.agendamentoId, JSON.stringify({ tipo: dados.detalhe }), dados.valor]
    );

    await client.query(
      `UPDATE agendamentos SET status = 'concluido', updated_at = now() WHERE id = $1`,
      [dados.agendamentoId]
    );

    await client.query("COMMIT");
    return rows[0].id as string;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function registrarPagamentoPixPendente(dados: {
  agendamentoId: string;
  valor: number;
  mercadopagoPaymentId: string;
  qrCodeBase64: string;
  copiaECola: string;
  expiraEm: Date;
}) {
  const { rows } = await pool.query(
    `INSERT INTO pagamentos (
      agendamento_id,
      forma,
      valor,
      status,
      mercadopago_payment_id,
      qr_code_base64,
      copia_e_cola,
      expira_em
    ) VALUES ($1, 'pix', $2, 'pendente', $3, $4, $5, $6)
    RETURNING id, codigo`,
    [
      dados.agendamentoId,
      dados.valor,
      dados.mercadopagoPaymentId,
      dados.qrCodeBase64,
      dados.copiaECola,
      dados.expiraEm.toISOString(),
    ]
  );
  return rows[0].id as string;
}

export async function registrarPagamentoPointPendente(dados: {
  agendamentoId: string;
  valor: number;
  mercadopagoPaymentId?: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO pagamentos (
      agendamento_id,
      forma,
      valor,
      status,
      mercadopago_payment_id
    ) VALUES ($1, 'point', $2, 'pendente', $3)
    RETURNING id, codigo`,
    [
      dados.agendamentoId,
      dados.valor,
      dados.mercadopagoPaymentId || null,
    ]
  );
  return rows[0].id as string;
}

export async function buscarLojaPorMercadoPagoPaymentId(paymentId: string) {
  const { rows } = await pool.query(
    `SELECT a.loja_id FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE p.mercadopago_payment_id = $1`,
    [paymentId]
  );
  return rows[0]?.loja_id ?? null;
}

export async function confirmarPagamentoPorMercadoPagoId(
  paymentId: string, 
  dadosPagamento: { qrCodeBase64?: string; copiaECola?: string; expiraEm?: Date }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: pagRows } = await client.query(
      `SELECT agendamento_id, status FROM pagamentos WHERE mercadopago_payment_id = $1 FOR UPDATE`,
      [paymentId]
    );

    if (pagRows.length === 0) {
      throw new Error("Pagamento não encontrado pelo payment_id do Mercado Pago.");
    }

    if (pagRows[0].status === "confirmado") {
      await client.query("COMMIT");
      return;
    }

    const agendamentoId = pagRows[0].agendamento_id;

    await client.query(
      `UPDATE pagamentos 
       SET status = 'confirmado', 
           confirmado_em = now(),
           qr_code_base64 = COALESCE($2, qr_code_base64),
           copia_e_cola = COALESCE($3, copia_e_cola),
           expira_em = COALESCE($4, expira_em)
       WHERE mercadopago_payment_id = $1`,
      [paymentId, dadosPagamento.qrCodeBase64 ?? null, dadosPagamento.copiaECola ?? null, dadosPagamento.expiraEm ?? null]
    );

    await client.query(
      `UPDATE agendamentos SET status = 'concluido', updated_at = now() WHERE id = $1`,
      [agendamentoId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function metricasFinanceiras(lojaId: string, inicio: Date, fim: Date) {
  const inicioIso = inicio.toISOString();
  const fimIso = fim.toISOString();

  const [confirmados, aReceber, topServicos] = await Promise.all([
    pool.query(
      `SELECT
          COALESCE(SUM(p.valor), 0) AS total_confirmado,
          COUNT(p.id)::int AS qtd_servicos
       FROM pagamentos p
       JOIN agendamentos a ON a.id = p.agendamento_id
       WHERE a.loja_id = $1
         AND p.status = 'confirmado'
         AND p.confirmado_em BETWEEN $2 AND $3`,
      [lojaId, inicioIso, fimIso]
    ),
    pool.query(
      `SELECT COALESCE(SUM(p.valor), 0) AS total_a_receber
       FROM pagamentos p
       JOIN agendamentos a ON a.id = p.agendamento_id
       WHERE a.loja_id = $1
         AND p.status = 'pendente'
         AND p.created_at BETWEEN $2 AND $3`,
      [lojaId, inicioIso, fimIso]
    ),
    pool.query(
      `SELECT
          ai.nome_servico AS nome,
          COUNT(ai.id)::int AS qtd,
          COALESCE(SUM(ai.preco), 0) AS total
       FROM agendamento_itens ai
       JOIN agendamentos a ON a.id = ai.agendamento_id
       JOIN pagamentos p ON p.agendamento_id = a.id
       WHERE a.loja_id = $1
         AND p.status = 'confirmado'
         AND p.confirmado_em BETWEEN $2 AND $3
       GROUP BY ai.nome_servico
       ORDER BY total DESC, qtd DESC
       LIMIT 5`,
      [lojaId, inicioIso, fimIso]
    ),
  ]);

  const totalConfirmado = parseFloat(confirmados.rows[0].total_confirmado);
  const qtdServicos = confirmados.rows[0].qtd_servicos as number;
  const totalAReceber = parseFloat(aReceber.rows[0].total_a_receber);
  const ticketMedio = qtdServicos > 0 ? totalConfirmado / qtdServicos : 0;

  return {
    totalConfirmado,
    qtdServicos,
    ticketMedio,
    totalAReceber,
    topServicos: topServicos.rows.map((s) => ({
      nome: s.nome as string,
      qtd: s.qtd as number,
      total: parseFloat(s.total),
    })),
  };
}

export async function faturamentoPorDia(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT to_char(p.confirmado_em AT TIME ZONE 'UTC', 'DD/MM') as dia,
            COALESCE(SUM(p.valor), 0) as total
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 AND p.status = 'confirmado' AND p.confirmado_em BETWEEN $2 AND $3
     GROUP BY dia
     ORDER BY min(p.confirmado_em) ASC`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows;
}

export async function listarPagamentosPaginados(lojaId: string, inicio: Date, fim: Date, pagina: number = 1, limite: number = 10) {
  const offset = (pagina - 1) * limite;
  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 AND COALESCE(p.confirmado_em, p.created_at) BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  const total = parseInt(countQuery.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT p.id, p.codigo, p.valor, p.forma, p.forma_manual_detalhe, p.status, p.confirmado_em, p.created_at, a.data_hora, a.codigo as agendamento_codigo, c.nome as cliente_nome
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     JOIN clientes c ON c.id = a.cliente_id
     WHERE a.loja_id = $1 AND COALESCE(p.confirmado_em, p.created_at) BETWEEN $2 AND $3
     ORDER BY COALESCE(p.confirmado_em, p.created_at) DESC
     LIMIT $4 OFFSET $5`,
    [lojaId, inicio.toISOString(), fim.toISOString(), limite, offset]
  );

  return {
    pagamentos: rows,
    total,
    totalPaginas: Math.ceil(total / limite),
  };
}