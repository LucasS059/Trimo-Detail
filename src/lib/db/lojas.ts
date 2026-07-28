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
  mercadopago_device_id: string | null;
  taxa_debito_percentual: number;
  taxa_credito_percentual: number;
  fuso_horario: string;
  cor_primaria: string;
  plano: "gratuito" | "pago";
  ativo: boolean;
};

export type CamposEditaveisLoja = {
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
};

export async function buscarLojaPorSlug(slug: string): Promise<Loja | null> {
  const { rows } = await pool.query(
    `SELECT id, nome, slug, nome_dono, descricao, imagem_url, endereco,
            antecedencia_minima_minutos, prazo_cancelamento_minutos,
            lembrete_confirmacao_minutos, dias_futuros_visiveis,
            mercadopago_access_token, mercadopago_user_id, mercadopago_device_id,
            taxa_debito_percentual, taxa_credito_percentual, fuso_horario,
            cor_primaria, plano, ativo
     FROM lojas
     WHERE slug = $1 AND ativo = TRUE`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function buscarLojaPorEmail(email: string) {
  const { rows } = await pool.query(
    `SELECT id, nome, slug, email_login, senha_hash FROM lojas WHERE email_login = $1 AND ativo = TRUE`,
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

export async function buscarDadosConfiguracaoLoja(lojaId: string) {
  const { rows } = await pool.query(
    `SELECT nome, slug, nome_dono, descricao, imagem_url, endereco,
            antecedencia_minima_minutos, prazo_cancelamento_minutos,
            lembrete_confirmacao_minutos, dias_futuros_visiveis,
            mercadopago_user_id, mercadopago_device_id,
            taxa_debito_percentual, taxa_credito_percentual,
            fuso_horario, cor_primaria,
            (mercadopago_access_token IS NOT NULL) AS tem_mercadopago_configurado
     FROM lojas WHERE id = $1`,
    [lojaId]
  );
  return rows[0] ?? null;
}

export async function obterOuCriarHorariosFuncionamento(lojaId: string) {
  let { rows: horarios } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento
     WHERE loja_id = $1
     ORDER BY dia_semana ASC`,
    [lojaId]
  );

  if (horarios.length === 0) {
    const padrao = [
      { dia: 0, abertura: "08:00", fechamento: "18:00", fechado: true },
      { dia: 1, abertura: "08:00", fechamento: "18:00", fechado: false },
      { dia: 2, abertura: "08:00", fechamento: "18:00", fechado: false },
      { dia: 3, abertura: "08:00", fechamento: "18:00", fechado: false },
      { dia: 4, abertura: "08:00", fechamento: "18:00", fechado: false },
      { dia: 5, abertura: "08:00", fechamento: "18:00", fechado: false },
      { dia: 6, abertura: "08:00", fechamento: "14:00", fechado: false },
    ];

    for (const h of padrao) {
      await pool.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [lojaId, h.dia, h.abertura, h.fechamento, h.fechado]
      );
    }

    const reload = await pool.query(
      `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
       FROM horarios_funcionamento WHERE loja_id = $1 ORDER BY dia_semana ASC`,
      [lojaId]
    );
    horarios = reload.rows;
  }

  return horarios;
}