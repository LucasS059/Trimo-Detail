"use server";

import { buscarClientePorId, buscarVeiculoPorId, criarVeiculo, deletarVeiculo } from "@/lib/db/clientes";
import { actionAutenticada, type ActionResponse } from "./utils";
import { revalidatePath } from "next/cache";

export async function criarVeiculoAction(clienteId: string, dados: {
  placa?: string;
  modelo: string;
  cor?: string;
}): Promise<ActionResponse<{ veiculoId: string }>> {
  return actionAutenticada(async (lojaId) => {
    const cliente = await buscarClientePorId(clienteId);
    if (!cliente || cliente.loja_id !== lojaId) {
      throw new Error("Cliente não encontrado ou não pertence à sua loja.");
    }

    const veiculoId = await criarVeiculo(clienteId, dados);
    revalidatePath("/clientes");
    return { veiculoId };
  });
}

export async function deletarVeiculoAction(veiculoId: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const veiculo = await buscarVeiculoPorId(veiculoId);
    if (!veiculo || veiculo.loja_id !== lojaId) {
      throw new Error("Veículo não encontrado ou não pertence à sua loja.");
    }

    await deletarVeiculo(veiculoId);
    revalidatePath("/clientes");
  });
}