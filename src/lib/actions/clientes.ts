"use server";

import {
  actionAutenticada,
  actionPublica,
  type ActionResponse,
} from "@/lib/actions/utils";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/client";
import {
  atualizarCliente,
  buscarClientePorId,
  criarCliente,
  criarVeiculo,
  deletarCliente,
  listarClientes,
} from "@/lib/db/clientes";
import { buscarLojaPorSlug } from "@/lib/db/lojas";
import { obterContatoDaSessao, encerrarSessaoCliente } from "@/lib/auth/sessao-cliente";

export async function listarClientesAction(busca?: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");
  const { clientes, total, totalPaginas } = await listarClientes(lojaId, busca);
  return { clientes, total, totalPaginas };
}

export async function criarClienteAction(dados: {
  nome: string;
  telefone: string;
  email?: string;
  veiculo?: { modelo: string; placa?: string; cor?: string };
}): Promise<ActionResponse<{ clienteId: string }>> {
  return actionAutenticada(async (lojaId) => {
    const clienteId = await criarCliente(lojaId, {
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email || null,
    });

    if (dados.veiculo?.modelo) {
      await criarVeiculo(clienteId, {
        modelo: dados.veiculo.modelo,
        placa: dados.veiculo.placa,
        cor: dados.veiculo.cor,
      });
    }

    revalidatePath("/(admin)/clientes");
    return { clienteId };
  });
}

export async function buscarClientesAutocompleteAction(termo: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  if (!termo || termo.trim().length === 0) {
    const { rows } = await pool.query(
      `SELECT id, nome, telefone FROM clientes WHERE loja_id = $1 AND ativo = TRUE ORDER BY nome ASC LIMIT 10`,
      [lojaId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT id, nome, telefone FROM clientes 
     WHERE loja_id = $1 
       AND ativo = TRUE 
       AND (nome ILIKE '%' || $2 || '%' OR telefone ILIKE '%' || $2 || '%')
     ORDER BY nome ASC 
     LIMIT 10`,
    [lojaId, termo.trim()]
  );
  return rows;
}

export async function atualizarClienteAction(
  clienteId: string,
  dados: {
    nome: string;
    telefone: string;
    email?: string;
  }
): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const cliente = await buscarClientePorId(clienteId);
    if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

    await atualizarCliente(clienteId, {
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email || null,
    });

    revalidatePath("/(admin)/clientes");
  });
}

export async function deletarClienteAction(clienteId: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const cliente = await buscarClientePorId(clienteId);
    if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

    await deletarCliente(clienteId);
    revalidatePath("/(admin)/clientes");
  });
}

export async function listarMeusAgendamentosAction(slug: string) {
  return actionPublica(async () => {
    const contato = await obterContatoDaSessao(slug);
    if (!contato) throw new Error("Sessão expirada.");

    const loja = await buscarLojaPorSlug(slug);
    if (!loja) throw new Error("Loja não encontrada.");

    const { rows: clientesEncontrados } = await pool.query(
      `SELECT id FROM clientes WHERE loja_id = $1 AND (telefone = $2 OR email = $2) AND ativo = TRUE`,
      [loja.id, contato]
    );

    if (clientesEncontrados.length === 0) return [];

    const { rows: agendamentos } = await pool.query(
      `SELECT a.id, a.codigo, a.data_hora, a.duracao_minutos, a.valor, a.status, a.presenca_confirmada,
              COALESCE(
                json_agg(
                  json_build_object('id', s.id, 'nome', s.nome, 'preco', ags.preco, 'duracaoMinutos', ags.duracao_minutos)
                ) FILTER (WHERE s.id IS NOT NULL), '[]'
              ) AS servicos
       FROM agendamentos a
       LEFT JOIN agendamento_itens ags ON ags.agendamento_id = a.id
       LEFT JOIN servicos s ON s.id = ags.servico_id
       WHERE a.cliente_id = ANY($1::uuid[])
       GROUP BY a.id
       ORDER BY a.data_hora DESC`,
      [clientesEncontrados.map((c) => c.id)]
    );
    return agendamentos;
  });
}

export async function encerrarSessaoClienteAction(slug: string) {
  return actionPublica(async () => {
    await encerrarSessaoCliente(slug);
    return { sucesso: true };
  });
}