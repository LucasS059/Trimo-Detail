"use server";
// lib/actions/servicos.ts

import { criarServico } from "@/lib/db/servicos";
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
