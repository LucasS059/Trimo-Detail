import { pool } from "./client";

export async function registrarBaixaManual(dados: { agendamentoId: string; valor: number; detalhe: string }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em)
       VALUES ($1, 'manual', $2, $3, 'confirmado', now())
       RETURNING id`,
      [dados.agendamentoId, dados.detalhe, dados.valor]
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

export async function buscarLojaPorMercadoPagoPaymentId(paymentId: string) {
  const { rows } = await pool.query(
    `SELECT a.loja_id FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE p.mercadopago_payment_id = $1`,
    [paymentId]
  );
  return rows[0]?.loja_id ?? null;
}

export async function confirmarPagamentoPorMercadoPagoId(paymentId: string) {
  const { rows } = await pool.query(
    `UPDATE pagamentos 
     SET status = 'confirmado', confirmado_em = now() 
     WHERE mercadopago_payment_id = $1 
     RETURNING agendamento_id`,
    [paymentId]
  );
  
  return rows[0] ?? null;
}

export async function metricasFinanceiras(lojaId: string, inicio: Date, fim: Date) {
  const { rows: confirmado } = await pool.query(
    `SELECT COALESCE(SUM(p.valor), 0) AS total, COUNT(DISTINCT a.id) as qtd
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 AND p.status = 'confirmado' AND p.confirmado_em BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  
  const { rows: pendente } = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) AS total
     FROM agendamentos
     WHERE loja_id = $1 AND status IN ('agendado', 'em_andamento', 'aguardando_pagamento') AND data_hora BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  const { rows: topServicos } = await pool.query(
    `SELECT s.nome, COALESCE(SUM(p.valor), 0) as total, COUNT(p.id) as qtd
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
     JOIN servicos s ON ags.servico_id = s.id
     WHERE a.loja_id = $1 AND p.status = 'confirmado' AND p.confirmado_em BETWEEN $2 AND $3
     GROUP BY s.id, s.nome
     ORDER BY total DESC LIMIT 4`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  const totalConfirmado = Number(confirmado[0].total);
  const qtdServicos = Number(confirmado[0].qtd);
  return {
    totalConfirmado,
    qtdServicos,
    ticketMedio: qtdServicos > 0 ? totalConfirmado / qtdServicos : 0,
    totalAReceber: Number(pendente[0].total),
    topServicos
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
     WHERE a.loja_id = $1 AND p.confirmado_em BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  const total = parseInt(countQuery.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT p.id, p.valor, p.forma, p.status, p.confirmado_em, a.data_hora, c.nome as cliente_nome
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     JOIN clientes c ON c.id = a.cliente_id
     WHERE a.loja_id = $1 AND p.confirmado_em BETWEEN $2 AND $3
     ORDER BY p.confirmado_em DESC
     LIMIT $4 OFFSET $5`,
    [lojaId, inicio.toISOString(), fim.toISOString(), limite, offset]
  );
  
  return { pagamentos: rows, total, totalPaginas: Math.ceil(total / limite), paginaAtual: pagina };
}