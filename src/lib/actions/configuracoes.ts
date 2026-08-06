"use server";

import { revalidatePath } from "next/cache";
import { actionAutenticada } from "./utils";
import { 
  atualizarConfiguracoesLoja, 
  buscarLojaPorSlug, 
  salvarHorariosNoBanco 
} from "@/lib/db/lojas";

export async function salvarConfiguracoesAction(dados: Record<string, any>) {
  return actionAutenticada(async (lojaId) => {
    if (dados.slug) {
      const existente = await buscarLojaPorSlug(dados.slug);
      if (existente && existente.id !== lojaId) {
        throw new Error("Este link público já está em uso por outra loja.");
      }
    }

    const dadosFiltrados = Object.fromEntries(
      Object.entries(dados).filter(([_, v]) => v !== undefined)
    );

    // O repositório lida automaticamente com a distribuição para as tabelas fatiadas (lojas, agenda, integrações)
    await atualizarConfiguracoesLoja(lojaId, dadosFiltrados);
    revalidatePath("/configuracoes");
  });
}

export async function salvarHorariosFuncionamentoAction(
  horarios: { dia_semana: number; hora_abertura: string; hora_fechamento: string; fechado: boolean }[]
) {
  return actionAutenticada(async (lojaId) => {
    await salvarHorariosNoBanco(lojaId, horarios);
    revalidatePath("/configuracoes");
  });
}