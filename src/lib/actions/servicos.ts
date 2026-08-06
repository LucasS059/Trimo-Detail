"use server";

import { actionAutenticada } from "./utils";
import { criarServico, atualizarServico, deletarServico } from "@/lib/db/servicos";
import { revalidatePath } from "next/cache";

export async function criarServicoAction(dados: {
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number;
}) {
  return actionAutenticada(async (lojaId) => {
    await criarServico(lojaId, dados);
    revalidatePath("/(admin)/servicos");
  });
}

export async function atualizarServicoAction(
  id: string,
  dados: { nome: string; descricao?: string; preco: number; duracaoMinutos: number; ativo: boolean }
) {
  return actionAutenticada(async (lojaId) => {
    await atualizarServico(id, lojaId, dados);
    revalidatePath("/(admin)/servicos");
  });
}

export async function excluirServicoAction(id: string) {
  return actionAutenticada(async (lojaId) => {
    await deletarServico(id, lojaId);
    revalidatePath("/(admin)/servicos");
  });
}