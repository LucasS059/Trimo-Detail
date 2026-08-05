import { pool } from "./client";
import { buscarServicosPorIds } from "./servicos";

export type StatusAgendamento =
  | "agendado"
  | "em_andamento"
  | "aguardando_pagamento"
  | "concluido"
  | "cancelado"
  | "nao_compareceu";

/** Erro específico para conflito de horário — a Action/UI sabe tratar este tipo. */
export class ConflitoHorarioError extends Error {
  constructor(message = "Esse horário acabou de ser reservado por outro cliente. Escolha outro horário.") {
    super(message);
    this.name = "ConflitoHorarioError";
  }
}

/** Código de erro do Postgres para violação de exclusion constraint. */
const PG_EXCLUSION_VIOLATION = "23P01";

export async function criarAgendamento(dados: {
  lojaId: string;
  clienteId: string;
  veiculoId?: string;
  servicosIds: string[];
  dataHora: Date;
}) {
  if (dados.servicosIds.length === 0) {
    throw new Error("Selecione ao menos um serviço.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const servicosReais = await buscarServicosPorIds(dados.servicosIds, dados.lojaId);
    if (servicosReais.length !== dados.servicosIds.length) {
      throw new Error("Serviços inválidos ou não pertencentes à loja.");
    }

    const valorTotal = servicosReais.reduce((s, item) => s + Number(item.preco), 0);
    const duracaoTotal = servicosReais.reduce((s, item) => s + item.duracao_minutos, 0);

    const inicioIso = dados.dataHora.toISOString();
    const fimIso = new Date(dados.dataHora.getTime() + duracaoTotal * 60000).toISOString();

    // Checagem otimista: falha rápido e com mensagem clara na maioria dos casos.
    // Não é 100% à prova de concorrência sozinha (ver constraint abaixo, que é a garantia real).
    const choque = await client.query(
      `SELECT id FROM agendamentos 
       WHERE loja_id = $1 
         AND status <> 'cancelado' 
         AND data_hora < $3 
         AND (data_hora + (duracao_minutos || ' minute')::interval) > $2
       FOR UPDATE`,
      [dados.lojaId, inicioIso, fimIso]
    );

    if (choque.rows.length > 0) {
      throw new ConflitoHorarioError();
    }

    const { rows } = await client.query(
      `INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, duracao_minutos, valor, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'agendado')
      RETURNING id`,
      [dados.lojaId, dados.clienteId, dados.veiculoId ?? null, inicioIso, duracaoTotal, valorTotal]
    );
    const agendamentoId = rows[0].id as string;

    for (const s of servicosReais) {
      await client.query(
        `INSERT INTO agendamento_servicos (agendamento_id, servico_id, nome_servico, preco, duracao_minutos)
         VALUES ($1, $2, $3, $4, $5)`,
        [agendamentoId, s.id, s.nome, s.preco, s.duracao_minutos]
      );
    }

    await client.query("COMMIT");
    return agendamentoId;
  } catch (err: any) {
    await client.query("ROLLBACK");

    // Rede de segurança real: se dois requests passaram pelo FOR UPDATE ao mesmo tempo
    // (phantom read) e ambos tentaram inserir, o Postgres rejeita o segundo aqui.
    if (err?.code === PG_EXCLUSION_VIOLATION) {
      throw new ConflitoHorarioError();
    }

    throw err;
  } finally {
    client.release();
  }
}

export async function listarAgendamentosPorPeriodo(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT a.id, a.data_hora, a.duracao_minutos, a.valor, a.status, a.presenca_confirmada,
            c.nome as cliente_nome, c.telefone as cliente_telefone,
            v.modelo as veiculo_modelo, v.placa as veiculo_placa,
            COALESCE(
              json_agg(
                json_build_object('id', ags.servico_id, 'nome', ags.nome_servico, 'preco', ags.preco, 'duracaoMinutos', ags.duracao_minutos)
              ) FILTER (WHERE ags.id IS NOT NULL), '[]'
            ) AS servicos
     FROM agendamentos a
     JOIN clientes c ON c.id = a.cliente_id
     LEFT JOIN veiculos v ON v.id = a.veiculo_id
     LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
     WHERE a.loja_id = $1 AND a.data_hora BETWEEN $2 AND $3
     GROUP BY a.id, c.id, v.id
     ORDER BY a.data_hora ASC`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows;
}

export async function atualizarStatusAgendamento(id: string, lojaId: string, status: StatusAgendamento) {
  await pool.query(
    `UPDATE agendamentos SET status = $1, updated_at = now() WHERE id = $2 AND loja_id = $3`,
    [status, id, lojaId]
  );
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

export async function excluirBloqueioDb(id: string, lojaId: string) {
  await pool.query(
    `DELETE FROM bloqueios_horario WHERE id = $1 AND loja_id = $2`,
    [id, lojaId]
  );
}

export async function listarBloqueiosAtivos(lojaId: string) {
  const { rows } = await pool.query(
    `SELECT id, inicio, fim, motivo FROM bloqueios_horario WHERE loja_id = $1 AND fim >= now() ORDER BY inicio ASC`,
    [lojaId]
  );
  return rows;
}

export async function listarBloqueiosParaSlots(lojaId: string, inicio: Date, fim: Date) {
  const { rows } = await pool.query(
    `SELECT inicio, fim FROM bloqueios_horario WHERE loja_id = $1 AND inicio < $3 AND fim > $2`,
    [lojaId, inicio.toISOString(), fim.toISOString()]
  );
  return rows;
}

export async function buscarAgendamento(id: string) {
  const { rows } = await pool.query(
    `SELECT a.id, a.data_hora, a.status, a.presenca_confirmada, a.valor,
            c.nome as cliente_nome, 
            l.nome as loja_nome, 
            l.slug as loja_slug,
            l.cor_primaria,
            l.fuso_horario,
            COALESCE(
              json_agg(
                json_build_object('id', ags.servico_id, 'nome', ags.nome_servico, 'preco', ags.preco, 'duracaoMinutos', ags.duracao_minutos)
              ) FILTER (WHERE ags.id IS NOT NULL), '[]'
            ) AS servicos
     FROM agendamentos a
     JOIN clientes c ON c.id = a.cliente_id
     JOIN lojas l ON l.id = a.loja_id
     LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
     WHERE a.id = $1
     GROUP BY a.id, c.id, l.id`,
    [id]
  );
  return rows[0] ?? null;
}

export async function atualizarStatus(id: string, status: string) {
  await pool.query(`UPDATE agendamentos SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
}