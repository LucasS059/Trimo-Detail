"use server";

import { atualizarConfiguracoesLoja } from "@/lib/db/lojas";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export async function salvarConfiguracoesAction(dados: {
  nome: string;
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

  const { mercadopago_access_token, mercadopago_user_id, ...resto } = dados;

  await atualizarConfiguracoesLoja(lojaId, {
    ...resto,
    ...(mercadopago_access_token ? { mercadopago_access_token } : {}),
    ...(mercadopago_user_id ? { mercadopago_user_id } : {}),
  });

  revalidatePath("/configuracoes");
}