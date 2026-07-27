"use server";

import {
  buscarClientePorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  listarClientes,
  listarVeiculosDoCliente,
} from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function listarClientesAction(busca?: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");
  return await listarClientes(lojaId, busca);
}

export async function criarClienteAction(dados: {
  nome: string;
  telefone: string;
  email?: string;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  await criarCliente(lojaId, {
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email ?? null,
  });
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
 * Busca leve pro autocomplete do modal de agendamento — reaproveita
 * listarClientes já existente, sem paginação, limitando a 8 resultados.
 */
export async function buscarClientesAutocompleteAction(termo: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  if (termo.trim().length < 2) return [];

  const { dados } = await listarClientes(lojaId, termo, 1, 8);
  return dados.map((c) => ({ id: c.id, nome: c.nome, telefone: c.telefone }));
}

export async function listarVeiculosClienteAction(clienteId: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const cliente = await buscarClientePorId(clienteId);
  if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

  return await listarVeiculosDoCliente(clienteId);
}