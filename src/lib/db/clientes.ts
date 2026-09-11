import { pool } from "./client";
import { normalizarPlaca } from "@/lib/utils/placa";

export async function listarClientes(lojaId: string, busca?: string, pagina = 1, limite = 10) {
  const offset = (pagina - 1) * limite;

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM clientes 
     WHERE loja_id = $1 
       AND ativo = TRUE
       AND ($2::text IS NULL OR nome ILIKE '%' || $2 || '%' OR telefone ILIKE '%' || $2 || '%' OR EXISTS (SELECT 1 FROM veiculos v2 WHERE v2.cliente_id = clientes.id AND v2.ativo = TRUE AND (v2.placa ILIKE '%' || $2 || '%' OR v2.modelo ILIKE '%' || $2 || '%')))`,
    [lojaId, busca ?? null]
  );
  const total = parseInt(countQuery.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT c.id, c.codigo, c.loja_id, c.nome, c.telefone, c.email,
            COALESCE(
              json_agg(
                json_build_object('id', v.id, 'placa', v.placa, 'modelo', v.modelo, 'cor', v.cor)
              ) FILTER (WHERE v.id IS NOT NULL AND v.ativo = TRUE), '[]'
            ) as veiculos
     FROM clientes c
     LEFT JOIN veiculos v ON v.cliente_id = c.id AND v.ativo = TRUE
     WHERE c.loja_id = $1 
       AND c.ativo = TRUE
       AND ($2::text IS NULL OR c.nome ILIKE '%' || $2 || '%' OR c.telefone ILIKE '%' || $2 || '%' OR EXISTS (SELECT 1 FROM veiculos v2 WHERE v2.cliente_id = c.id AND v2.ativo = TRUE AND (v2.placa ILIKE '%' || $2 || '%' OR v2.modelo ILIKE '%' || $2 || '%')))
     GROUP BY c.id, c.codigo
     ORDER BY c.nome ASC
     LIMIT $3 OFFSET $4`,
    [lojaId, busca ?? null, limite, offset]
  );

  return { clientes: rows, total, totalPaginas: Math.ceil(total / limite) };
}

export async function buscarOuCriarCliente(lojaId: string, dados: { nome: string; telefone: string, email?: string | null }) {
  const { rows: existente } = await pool.query(
    `SELECT id, email FROM clientes WHERE loja_id = $1 AND telefone = $2 AND ativo = TRUE`,
    [lojaId, dados.telefone]
  );

  if (existente[0]) {
    const cliente = existente[0];
    if (dados.email && dados.email !== cliente.email) {
      await pool.query(
        `UPDATE clientes SET email = $1, updated_at = now() WHERE id = $2`,
        [dados.email, cliente.id]
      );
    }
    return cliente.id as string;
  }

  const { rows: novo } = await pool.query(
    `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lojaId, dados.nome, dados.telefone, dados.email ?? null]
  );
  return novo[0].id as string;
}

export async function buscarClientePorId(id: string) {
  const { rows } = await pool.query(`SELECT id, codigo, loja_id, nome, telefone, email, ativo, created_at, updated_at FROM clientes WHERE id = $1 AND ativo = TRUE`, [id]);
  return rows[0] ?? null;
}

export async function criarCliente(lojaId: string, dados: { nome: string; telefone: string; email?: string | null }) {
  const { rows } = await pool.query(
    `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lojaId, dados.nome, dados.telefone, dados.email ?? null]
  );
  return rows[0].id as string;
}

export async function atualizarCliente(clienteId: string, dados: { nome: string; telefone: string; email?: string | null }) {
  await pool.query(
    `UPDATE clientes SET nome = $1, telefone = $2, email = $3, updated_at = now() WHERE id = $4`,
    [dados.nome, dados.telefone, dados.email ?? null, clienteId]
  );
}

export async function deletarCliente(clienteId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE clientes SET ativo = FALSE, updated_at = now() WHERE id = $1`, [clienteId]);
    await client.query(`UPDATE veiculos SET ativo = FALSE WHERE cliente_id = $1`, [clienteId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listarVeiculosDoCliente(clienteId: string) {
  const { rows } = await pool.query(
    `SELECT id, placa, modelo, cor FROM veiculos WHERE cliente_id = $1 AND ativo = TRUE ORDER BY created_at DESC`,
    [clienteId]
  );
  return rows;
}

export async function buscarVeiculoPorId(veiculoId: string) {
  const { rows } = await pool.query(
    `SELECT v.id, v.cliente_id, v.placa, v.modelo, v.cor, v.ativo, c.loja_id 
     FROM veiculos v
     JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = $1 AND v.ativo = TRUE`, 
    [veiculoId]
  );
  return rows[0] ?? null;
}

export async function criarVeiculo(clienteId: string, dados: { placa?: string; modelo: string; cor?: string }) {
  const placa = normalizarPlaca(dados.placa);

  if (placa) {
    const { rows: existente } = await pool.query(
      `SELECT id FROM veiculos WHERE cliente_id = $1 AND placa = $2 AND ativo = TRUE`,
      [clienteId, placa]
    );
    if (existente[0]) {
      return existente[0].id as string;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO veiculos (cliente_id, placa, modelo, cor) VALUES ($1, $2, $3, $4) RETURNING id`,
    [clienteId, placa, dados.modelo, dados.cor ?? null]
  );
  return rows[0].id as string;
}

export async function deletarVeiculo(veiculoId: string) {
  await pool.query(`UPDATE veiculos SET ativo = FALSE WHERE id = $1`, [veiculoId]);
}

export async function obterHistoricoCliente(lojaId: string, clienteId: string) {
  const [metricasRes, agendamentosRes] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN a.status = 'concluido' THEN a.valor ELSE 0 END), 0) AS total_gasto,
         COUNT(CASE WHEN a.status = 'concluido' THEN 1 END)::int AS total_concluidos,
         COUNT(CASE WHEN a.status IN ('agendado', 'em_andamento', 'aguardando_pagamento') THEN 1 END)::int AS total_ativos,
         COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END)::int AS total_cancelados,
         COUNT(CASE WHEN a.status = 'nao_compareceu' THEN 1 END)::int AS total_nao_compareceu
       FROM agendamentos a
       WHERE a.loja_id = $1 AND a.cliente_id = $2`,
      [lojaId, clienteId]
    ),
    pool.query(
      `SELECT a.id, a.codigo, a.data_hora, a.valor, a.status, a.observacoes,
              v.modelo AS veiculo_modelo, v.placa AS veiculo_placa,
              COALESCE(
                json_agg(
                  json_build_object('nome', ags.nome_servico, 'preco', ags.preco)
                ) FILTER (WHERE ags.id IS NOT NULL), '[]'
              ) AS servicos
       FROM agendamentos a
       LEFT JOIN veiculos v ON v.id = a.veiculo_id
       LEFT JOIN agendamento_itens ags ON ags.agendamento_id = a.id
       WHERE a.loja_id = $1 AND a.cliente_id = $2
       GROUP BY a.id, a.codigo, a.data_hora, a.valor, a.status, a.observacoes, v.modelo, v.placa
       ORDER BY a.data_hora DESC
       LIMIT 10`,
      [lojaId, clienteId]
    ),
  ]);

  const m = metricasRes.rows[0];
  const totalGasto = parseFloat(m?.total_gasto || "0");
  const totalConcluidos = Number(m?.total_concluidos || 0);
  const ticketMedio = totalConcluidos > 0 ? totalGasto / totalConcluidos : 0;

  return {
    totalGasto,
    totalConcluidos,
    totalAtivos: Number(m?.total_ativos || 0),
    totalCancelados: Number(m?.total_cancelados || 0),
    totalNaoCompareceu: Number(m?.total_nao_compareceu || 0),
    ticketMedio,
    agendamentos: agendamentosRes.rows,
  };
}

/**
 * Busca um cliente pelo telefone OU email na loja, retornando seus dados e veículos.
 * Usado no checkout público para pré-preenchimento automático.
 */
export async function buscarClientePorContato(
  lojaId: string,
  contato: string
): Promise<{ id: string; nome: string; email: string | null; veiculos: { id: string; modelo: string; placa: string | null; cor: string | null }[] } | null> {
  const { rows } = await pool.query(
    `SELECT c.id, c.nome, c.email,
            COALESCE(
              json_agg(
                json_build_object('id', v.id, 'modelo', v.modelo, 'placa', v.placa, 'cor', v.cor)
              ) FILTER (WHERE v.id IS NOT NULL AND v.ativo = TRUE), '[]'
            ) AS veiculos
     FROM clientes c
     LEFT JOIN veiculos v ON v.cliente_id = c.id
     WHERE c.loja_id = $1
       AND c.ativo = TRUE
       AND (c.telefone = $2 OR c.email = $2)
     GROUP BY c.id, c.nome, c.email
     LIMIT 1`,
    [lojaId, contato.trim()]
  );
  return rows[0] ?? null;
}