// lib/db/lojas.ts
import { pool } from "./client";

export type Loja = {
  id: string;
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
  mercadopago_access_token: string | null;
  mercadopago_user_id: string | null;
  plano: "gratuito" | "pago";
  ativo: boolean;
};

// Type nomeado à parte em vez de Partial<Pick<...>> inline — evita esse tipo de
// problema de parsing e fica mais fácil de reaproveitar em outros arquivos.
export type CamposEditaveisLoja = {
  nome?: string;
  nome_dono?: string | null;
  descricao?: string | null;
  imagem_url?: string | null;
  endereco?: string | null;
  antecedencia_minima_minutos?: number;
  prazo_cancelamento_minutos?: number;
  lembrete_confirmacao_minutos?: number;
  dias_futuros_visiveis?: number;
  mercadopago_access_token?: string;
  mercadopago_user_id?: string;
};

export async function buscarLojaPorSlug(slug: string): Promise<Loja | null> {
  const { rows } = await pool.query(
    `SELECT id, nome, slug, nome_dono, descricao, imagem_url, endereco,
            antecedencia_minima_minutos, prazo_cancelamento_minutos,
            lembrete_confirmacao_minutos, dias_futuros_visiveis,
            mercadopago_access_token, mercadopago_user_id, plano, ativo
     FROM lojas
     WHERE slug = $1 AND ativo = TRUE`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function buscarLojaPorEmail(email: string) {
  const { rows } = await pool.query(
    `SELECT id, nome, slug, email_login, senha_hash FROM lojas WHERE email_login = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarHorariosFuncionamento(lojaId: string) {
  const { rows } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento
     WHERE loja_id = $1
     ORDER BY dia_semana`,
    [lojaId]
  );
  return rows;
}

export async function atualizarConfiguracoesLoja(
  lojaId: string,
  dados: CamposEditaveisLoja
): Promise<void> {
  const campos = Object.keys(dados);
  if (campos.length === 0) return;

  const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map((campo) => (dados as Record<string, unknown>)[campo]);

  await pool.query(
    `UPDATE lojas SET ${sets}, updated_at = now() WHERE id = $1`,
    [lojaId, ...valores]
  );
}