// lib/db/clientes.ts
import { pool } from "./client";

export type Cliente = {
  id: string;
  loja_id: string;
  nome: string;
  telefone: string;
  email: string | null;
};

export async function listarClientes(lojaId: string, busca?: string) {
  const { rows } = await pool.query(
    `SELECT id, loja_id, nome, telefone, email
     FROM clientes
     WHERE loja_id = $1
       AND ($2::text IS NULL OR nome ILIKE '%' || $2 || '%' OR telefone ILIKE '%' || $2 || '%')
     ORDER BY nome`,
    [lojaId, busca ?? null]
  );
  return rows as Cliente[];
}

export async function buscarOuCriarCliente(
  lojaId: string,
  dados: { nome: string; telefone: string; email?: string }
) {
  const existente = await pool.query(
    `SELECT id FROM clientes WHERE loja_id = $1 AND telefone = $2`,
    [lojaId, dados.telefone]
  );
  if (existente.rows[0]) return existente.rows[0].id as string;

  const { rows } = await pool.query(
    `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lojaId, dados.nome, dados.telefone, dados.email ?? null]
  );
  return rows[0].id as string;
}

export async function listarVeiculosDoCliente(clienteId: string) {
  const { rows } = await pool.query(
    `SELECT id, placa, modelo, cor FROM veiculos WHERE cliente_id = $1 ORDER BY created_at DESC`,
    [clienteId]
  );
  return rows;
}

export async function criarVeiculo(
  clienteId: string,
  dados: { placa?: string; modelo: string; cor?: string }
) {
  const { rows } = await pool.query(
    `INSERT INTO veiculos (cliente_id, placa, modelo, cor) VALUES ($1, $2, $3, $4) RETURNING id`,
    [clienteId, dados.placa ?? null, dados.modelo, dados.cor ?? null]
  );
  return rows[0].id as string;
}

export async function historicoServicosDoCliente(clienteId: string) {
  const { rows } = await pool.query(
    `SELECT a.id, a.data_hora, a.status, a.valor, s.nome AS servico_nome
     FROM agendamentos a
     JOIN servicos s ON s.id = a.servico_id
     WHERE a.cliente_id = $1
     ORDER BY a.data_hora DESC`,
    [clienteId]
  );
  return rows;
}
