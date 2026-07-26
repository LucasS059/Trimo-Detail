"use server";

import { buscarClientePorId, buscarVeiculoPorId, criarVeiculo, deletarVeiculo } from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function criarVeiculoAction(clienteId: string, dados: {
  placa?: string;
  modelo: string;
  cor?: string;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const cliente = await buscarClientePorId(clienteId);
  if (!cliente || cliente.loja_id !== lojaId) throw new Error("Cliente não encontrado");

  await criarVeiculo(clienteId, dados);
  revalidatePath("/(admin)/clientes");
}

export async function deletarVeiculoAction(veiculoId: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const veiculo = await buscarVeiculoPorId(veiculoId);
  if (!veiculo || veiculo.loja_id !== lojaId) throw new Error("Veículo não encontrado");

  await deletarVeiculo(veiculoId);
  revalidatePath("/(admin)/clientes");
}
