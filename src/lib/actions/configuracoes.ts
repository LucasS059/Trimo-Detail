"use server";

import { atualizarConfiguracoesLoja, buscarLojaPorSlug } from "@/lib/db/lojas";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function salvarConfiguracoesAction(dados: {
  nome: string;
  slug: string;
  nome_dono: string | null;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
  antecedencia_minima_minutos: number;
  prazo_cancelamento_minutos: number;
  lembrete_confirmacao_minutos: number;
  dias_futuros_visiveis: number;
  mercadopago_access_token?: string;
  mercadopago_user_id?: string | null;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  if (dados.slug) {
    const lojaExistente = await buscarLojaPorSlug(dados.slug);
    if (lojaExistente && lojaExistente.id !== lojaId) {
      throw new Error("Este link público já está em uso. Escolha outro slug.");
    }
  }

  const { mercadopago_access_token, mercadopago_user_id, ...resto } = dados;

  await atualizarConfiguracoesLoja(lojaId, {
    ...resto,
    ...(mercadopago_access_token ? { mercadopago_access_token } : {}),
    ...(mercadopago_user_id ? { mercadopago_user_id } : {}),
  });

  revalidatePath("/configuracoes");
}