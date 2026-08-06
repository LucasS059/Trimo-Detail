"use server";

import {
  buscarClientePorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  listarClientes,
  listarVeiculosDoCliente,
  criarVeiculo,
} from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/client";
import { buscarLojaPorSlug } from "@/lib/db/lojas";
import { obterContatoDaSessao, encerrarSessaoCliente } from "@/lib/auth/sessao-cliente";
import { normalizarContato, detectarCanal } from "@/lib/utils/contato";
import { validarCodigoAction } from "@/lib/actions/verificacao";
import { actionPublica } from "@/lib/actions/utils";

export async function listarClientesAction(busca?: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");
  return await listarClientes(lojaId, busca);
}

export async function criarClienteAction(dados: {
  nome: string;
  telefone: string;
  email?: string;
  veiculo?: { modelo: string; placa?: string; cor?: string };
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const clienteId = await criarCliente(lojaId, {
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email ?? null,
  });

  if (dados.veiculo && dados.veiculo.modelo) {
    await criarVeiculo(clienteId, {
      modelo: dados.veiculo.modelo,
      placa: dados.veiculo.placa ?? undefined,
      cor: dados.veiculo.cor ?? undefined,
    });
  }
  revalidatePath("/(admin)/clientes");
}

export async function atualizarClienteAction(clienteId: string, dados: {
  nome: string;
  telefone: string;
  email?: string;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const cliente = await buscarClientePorId(clienteId);
  if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

  await atualizarCliente(clienteId, {
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email ?? null,
  });
  revalidatePath("/(admin)/clientes");
}

export async function deletarClienteAction(clienteId: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const cliente = await buscarClientePorId(clienteId);
  if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

  await deletarCliente(clienteId);
  revalidatePath("/(admin)/clientes");
}

/**
 * Busca leve pro autocomplete do modal de agendamento
 */
export async function buscarClientesAutocompleteAction(termo: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  if (termo.trim().length < 2) return [];

  // Corrigido: desestrutura 'clientes' e não 'dados'
  const { clientes } = await listarClientes(lojaId, termo, 1, 8);
  return clientes.map((c: any) => ({ id: c.id, nome: c.nome, telefone: c.telefone }));
}

export async function listarVeiculosClienteAction(clienteId: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const cliente = await buscarClientePorId(clienteId);
  if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

  return await listarVeiculosDoCliente(clienteId);
}

// ============================================================
// Área pública — "Meus agendamentos" (vitrine do cliente final)
// ============================================================

export async function listarMeusAgendamentosAction(slug: string) {
  const contato = await obterContatoDaSessao(slug);
  if (!contato) throw new Error("Sessão expirada. Faça login novamente.");

  const loja = await buscarLojaPorSlug(slug);
  if (!loja) throw new Error("Loja não encontrada.");

  const { rows: clientesEncontrados } = await pool.query(
    `SELECT id FROM clientes WHERE loja_id = $1 AND (telefone = $2 OR email = $2)`,
    [loja.id, contato]
  );
  if (clientesEncontrados.length === 0) return [];

  const { rows: agendamentos } = await pool.query(
    `SELECT a.id, a.data_hora, a.status, a.presenca_confirmada,
            COALESCE(
              json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco))
              FILTER (WHERE s.id IS NOT NULL), '[]'
            ) AS servicos
     FROM agendamentos a
     LEFT JOIN agendamento_servicos ags ON ags.agendamento_id = a.id
     LEFT JOIN servicos s ON s.id = ags.servico_id
     WHERE a.cliente_id = ANY($1::uuid[])
     GROUP BY a.id
     ORDER BY a.data_hora DESC`,
    [clientesEncontrados.map((c) => c.id)]
  );

  return agendamentos;
}

export async function encerrarSessaoClienteAction(slug: string) {
  return actionPublica(async () => {
    await encerrarSessaoCliente(slug);
    return { sucesso: true };
  });
}

export async function trocarContatoAction(
  slug: string,
  novoContatoDigitado: string,
  codigoDigitado: string
) {
  const contatoAtual = await obterContatoDaSessao(slug);
  if (!contatoAtual) throw new Error("Sessão expirada. Faça login novamente.");

  const canal = detectarCanal(novoContatoDigitado);
  const novoContato = normalizarContato(novoContatoDigitado, canal);

  await validarCodigoAction(novoContato, codigoDigitado, slug);

  const loja = await buscarLojaPorSlug(slug);
  if (!loja) throw new Error("Loja não encontrada.");

  const coluna = canal === "whatsapp" ? "telefone" : "email";

  try {
    await pool.query(
      `UPDATE clientes SET ${coluna} = $1 WHERE loja_id = $2 AND (telefone = $3 OR email = $3)`,
      [novoContato, loja.id, contatoAtual]
    );
  } catch (err: any) {
    if (err.code === "23505") {
      throw new Error("Esse contato já está associado a outro cadastro nessa loja.");
    }
    throw err;
  }
}