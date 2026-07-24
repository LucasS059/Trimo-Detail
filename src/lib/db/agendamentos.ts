import { pool } from "./client";

export type StatusAgendamento =
  | "agendado"
  | "em_andamento"
  | "aguardando_pagamento"
  | "concluido"
  | "cancelado"
  | "nao_compareceu";

export type Agendamento = {
  id: string;
  loja_id: string;
  cliente_id: string;
  veiculo_id: string | null;
  servico_id: string;
  data_hora: string;
  duracao_minutos: number;
  valor: string;
  status: StatusAgendamento;
  presenca_confirmada: boolean;
};

export async function listarAgendamentosPorPeriodo(
  lojaId: string,
  inicio: Date,
  fim: Date
) {
  const { rows } = await pool.query(
    `SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
            s.nome AS servico_nome, v.modelo AS veiculo_modelo, v.placa AS veiculo_placa,
            p.qr_code_base64 AS pix_qr_code, p.copia_e_cola AS pix_copia_cola, p.expira_em AS pix_expira_em
     FROM agendamentos a
     JOIN clientes c ON c.id = a.cliente_id
     JOIN servicos s ON s.id = a.servico_id
     LEFT JOIN veiculos v ON v.id = a.veiculo_id
     LEFT JOIN LATERAL (
       SELECT qr_code_base64, copia_e_cola, expira_em
       FROM pagamentos p
       WHERE p.agendamento_id = a.id
         AND p.forma = 'pix' AND p.status = 'pendente'
         AND (p.expira_em IS NULL OR p.expira_em > now())
       ORDER BY p.created_at DESC
       LIMIT 1
     ) p ON TRUE
     WHERE a.loja_id = $1 AND a.data_hora BETWEEN $2 AND $3
     ORDER BY a.data_hora`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows;
}

export async function buscarAgendamento(id: string) {
  const { rows } = await pool.query(
    `SELECT a.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
            s.nome AS servico_nome, l.slug AS loja_slug, l.nome AS loja_nome
     FROM agendamentos a
     JOIN clientes c ON c.id = a.cliente_id
     JOIN servicos s ON s.id = a.servico_id
     JOIN lojas l ON l.id = a.loja_id
     WHERE a.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarAgendamento(dados: {
  lojaId: string;
  clienteId: string;
  veiculoId?: string;
  servicoId: string;
  dataHora: Date;
  duracaoMinutos: number;
  valor: number;
}) {
  const { rows } = await pool.query(
    `INSERT INTO agendamentos
       (loja_id, cliente_id, veiculo_id, servico_id, data_hora, duracao_minutos, valor, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendado')
     RETURNING id`,
    [
      dados.lojaId,
      dados.clienteId,
      dados.veiculoId ?? null,
      dados.servicoId,
      dados.dataHora.toISOString(),
      dados.duracaoMinutos,
      dados.valor,
    ]
  );
  return rows[0].id as string;
}

export async function atualizarStatus(id: string, status: StatusAgendamento) {
  await pool.query(
    `UPDATE agendamentos SET status = $1, updated_at = now() WHERE id = $2`,
    [status, id]
  );
}

export async function marcarPresencaConfirmada(id: string) {
  await pool.query(
    `UPDATE agendamentos SET presenca_confirmada = TRUE, updated_at = now() WHERE id = $1`,
    [id]
  );
}

export async function cancelarAgendamento(id: string, canceladoPor: "cliente" | "dono") {
  await pool.query(
    `UPDATE agendamentos
     SET status = 'cancelado', cancelado_por = $1, updated_at = now()
     WHERE id = $2`,
    [canceladoPor, id]
  );
}

export async function listarOcupacoesParaSlots(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT data_hora, duracao_minutos
     FROM agendamentos
     WHERE loja_id = $1
       AND status <> 'cancelado'
       AND data_hora BETWEEN $2 AND $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows as { data_hora: string; duracao_minutos: number }[];
}

export async function criarBloqueioDb(dados: {
  lojaId: string;
  inicio: Date;
  fim: Date;
  motivo?: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO bloqueios_horario (loja_id, inicio, fim, motivo)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [dados.lojaId, dados.inicio.toISOString(), dados.fim.toISOString(), dados.motivo || null]
  );
  return rows[0].id as string;
}

export async function listarBloqueiosParaSlots(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT inicio, fim 
     FROM bloqueios_horario 
     WHERE loja_id = $1 
       AND inicio >= $2 
       AND fim <= $3`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows as { inicio: string; fim: string }[];
}