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

// ==========================================
// NOVAS FUNÇÕES PARA O DASHBOARD COM GRÁFICO E LISTA PAGINADA
// ==========================================

export async function faturamentoPorDia(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT TO_CHAR(p.confirmado_em, 'DD/MM') as dia, SUM(p.valor) as total
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 
       AND p.status = 'confirmado' 
       AND p.confirmado_em BETWEEN $2 AND $3
     GROUP BY dia, DATE(p.confirmado_em)
     ORDER BY DATE(p.confirmado_em) ASC`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows.map(r => ({ dia: r.dia, total: Number(r.total) }));
}

export async function listarPagamentosPaginados(lojaId: string, inicio: Date, fim: Date, pagina: number = 1, limite: number = 8) {
  const offset = (pagina - 1) * limite;

  const countQuery = await pool.query(
    `SELECT COUNT(*)
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 AND p.confirmado_em BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  const total = parseInt(countQuery.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT p.id, p.valor, p.forma, p.forma_manual_detalhe, p.status, p.confirmado_em as created_at,
            c.nome as cliente_nome, s.nome as servico_nome
     FROM pagamentos p
     JOIN agendamentos a ON p.agendamento_id = a.id
     JOIN clientes c ON a.cliente_id = c.id
     JOIN servicos s ON a.servico_id = s.id
     WHERE a.loja_id = $1 AND p.confirmado_em BETWEEN $2 AND $3
     ORDER BY p.confirmado_em DESC
     LIMIT $4 OFFSET $5`,
    [lojaId, inicio.toISOString(), fim.toISOString(), limite, offset]
  );

  return {
    dados: rows,
    totalPaginas: Math.ceil(total / limite),
    paginaAtual: pagina,
    totalRegistros: total
  };
}
export async function metricasFinanceiras(lojaId: string, inicio: Date, fim: Date) {
  // 1. Faturamento real e Ticket Médio do mês
  const { rows: fat } = await pool.query(
    `SELECT 
        COALESCE(SUM(p.valor), 0) AS total_confirmado,
        COALESCE(AVG(p.valor), 0) AS ticket_medio,
        COUNT(p.id) AS qtd_servicos
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     WHERE a.loja_id = $1 
       AND p.status = 'confirmado' 
       AND p.confirmado_em BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  // 2. Previsão de Caixa (Aguardando Pagamento + Agendados para este mês)
  const { rows: pend } = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) AS total_a_receber
     FROM agendamentos
     WHERE loja_id = $1
       AND status IN ('agendado', 'em_andamento', 'aguardando_pagamento')
       AND data_hora BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  // 3. Ranking de Serviços (Quais serviços dão mais lucro?)
  const { rows: topServicos } = await pool.query(
    `SELECT s.nome, COALESCE(SUM(p.valor), 0) as total, COUNT(p.id) as qtd
     FROM pagamentos p
     JOIN agendamentos a ON a.id = p.agendamento_id
     JOIN servicos s ON a.servico_id = s.id
     WHERE a.loja_id = $1 
       AND p.status = 'confirmado' 
       AND p.confirmado_em BETWEEN $2 AND $3
     GROUP BY s.id, s.nome
     ORDER BY total DESC
     LIMIT 4`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );

  return {
    totalConfirmado: Number(fat[0].total_confirmado),
    ticketMedio: Number(fat[0].ticket_medio),
    qtdServicos: Number(fat[0].qtd_servicos),
    totalAReceber: Number(pend[0].total_a_receber),
    topServicos: topServicos.map(s => ({
      nome: s.nome,
      total: Number(s.total),
      qtd: Number(s.qtd)
    }))
  };
}