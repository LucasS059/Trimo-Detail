// lib/db/servicos.ts
import { pool } from "./client";

export type Servico = {
  id: string;
  loja_id: string;
  nome: string;
  descricao: string | null;
  preco: string; // numeric vem como string do pg
  duracao_minutos: number;
  ativo: boolean;
};

export async function listarServicos(lojaId: string, apenasAtivos = false) {
  const { rows } = await pool.query<Servico>(
    `SELECT id, loja_id, nome, descricao, preco, duracao_minutos, ativo
     FROM servicos
     WHERE loja_id = $1 ${apenasAtivos ? "AND ativo = TRUE" : ""}
     ORDER BY nome`,
    [lojaId]
  );
  return rows;
}

export async function buscarServico(id: string, lojaId: string) {
  const { rows } = await pool.query<Servico>(
    `SELECT id, loja_id, nome, descricao, preco, duracao_minutos, ativo
     FROM servicos WHERE id = $1 AND loja_id = $2`,
    [id, lojaId]
  );
  return rows[0] ?? null;
}

export async function criarServico(
  lojaId: string,
  dados: { nome: string; descricao?: string; preco: number; duracaoMinutos: number }
) {
  const { rows } = await pool.query(
    `INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [lojaId, dados.nome, dados.descricao ?? null, dados.preco, dados.duracaoMinutos]
  );
  return rows[0].id as string;
}

export async function atualizarServico(
  id: string,
  lojaId: string,
  dados: { nome: string; descricao?: string; preco: number; duracaoMinutos: number; ativo: boolean }
) {
  await pool.query(
    `UPDATE servicos
     SET nome = $1, descricao = $2, preco = $3, duracao_minutos = $4, ativo = $5
     WHERE id = $6 AND loja_id = $7`,
    [dados.nome, dados.descricao ?? null, dados.preco, dados.duracaoMinutos, dados.ativo, id, lojaId]
  );
}

export async function excluirServico(id: string, lojaId: string) {
  await pool.query(`DELETE FROM servicos WHERE id = $1 AND loja_id = $2`, [id, lojaId]);
}
