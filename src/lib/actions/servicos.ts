// lib/actions/servicos.ts
"use server";

import { criarServico, atualizarServico, excluirServico } from "@/lib/db/servicos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function criarServicoAction(dados: {
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMinutos: number;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  await criarServico(lojaId, dados);
  revalidatePath("/(admin)/servicos");
}

export async function atualizarServicoAction(
  id: string,
  dados: {
    nome: string;
    descricao?: string;
    preco: number;
    duracaoMinutos: number;
    ativo: boolean;
  }
) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  await atualizarServico(id, lojaId, dados);
  revalidatePath("/(admin)/servicos");
}

export async function excluirServicoAction(id: string) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  await excluirServico(id, lojaId);
  revalidatePath("/(admin)/servicos");
}