"use server";

import { atualizarConfiguracoesLoja, buscarLojaPorSlug } from "@/lib/db/lojas";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { pool } from "../db/client";

export async function salvarConfiguracoesAction(dados: {
  nome?: string;
  slug?: string;
  nome_dono?: string | null;
  descricao?: string | null;
  imagem_url?: string | null;
  endereco?: string | null;
  antecedencia_minima_minutos?: number;
  prazo_cancelamento_minutos?: number;
  lembrete_confirmacao_minutos?: number;
  dias_futuros_visiveis?: number;
  mercadopago_access_token?: string;
  mercadopago_user_id?: string | null;
  mercadopago_device_id?: string | null;
  taxa_debito_percentual?: number;
  taxa_credito_percentual?: number;
  fuso_horario?: string;
  cor_primaria?: string;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  if (dados.slug) {
    const lojaExistente = await buscarLojaPorSlug(dados.slug);
    if (lojaExistente && lojaExistente.id !== lojaId) {
      throw new Error("Este link público já está em uso. Escolha outro slug.");
    }
  }

  const dadosParaAtualizar: Record<string, unknown> = {};

  Object.entries(dados).forEach(([chave, valor]) => {
    if (valor !== undefined) {
      dadosParaAtualizar[chave] = valor;
    }
  });

  await atualizarConfiguracoesLoja(lojaId, dadosParaAtualizar);

  revalidatePath("/configuracoes");
}

export async function salvarHorariosFuncionamentoAction(
  horarios: { dia_semana: number; hora_abertura: string; hora_fechamento: string; fechado: boolean }[]
) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  for (const h of horarios) {
    await pool.query(
      `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (loja_id, dia_semana) 
       DO UPDATE SET hora_abertura = $3, hora_fechamento = $4, fechado = $5`,
      [lojaId, h.dia_semana, h.hora_abertura, h.hora_fechamento, h.fechado]
    );
  }

  revalidatePath("/configuracoes");
}