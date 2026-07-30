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

export async function buscarLojaPorId(id: string): Promise<Loja | null> {
  const { rows } = await pool.query<Loja>(`SELECT * FROM lojas WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function buscarLojaPorSlug(slug: string): Promise<Loja | null> {
  const { rows } = await pool.query<Loja>(`SELECT * FROM lojas WHERE slug = $1`, [slug]);
  return rows[0] ?? null;
}

export async function buscarLojaPorEmail(email: string) {
  const { rows } = await pool.query(
    `SELECT id, senha_hash FROM lojas WHERE email_login = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarConfiguracoesLoja(lojaId: string) {
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

export async function atualizarConfiguracoesLoja(lojaId: string, dados: Record<string, unknown>) {
  const chaves = Object.keys(dados);
  if (chaves.length === 0) return;

  const setClause = chaves.map((chave, i) => `${chave} = $${i + 2}`).join(", ");
  const valores = Object.values(dados);

  await pool.query(
    `UPDATE lojas SET ${setClause}, updated_at = now() WHERE id = $1`,
    [lojaId, ...valores]
  );
}

export async function obterOuCriarHorariosFuncionamento(lojaId: string) {
  const { rows: existentes } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento
     WHERE loja_id = $1
     ORDER BY dia_semana ASC`,
    [lojaId]
  );

  if (existentes.length > 0) return existentes;

  await pool.query(
    `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
     VALUES 
       ($1, 0, '08:00', '18:00', true),
       ($1, 1, '08:00', '18:00', false),
       ($1, 2, '08:00', '18:00', false),
       ($1, 3, '08:00', '18:00', false),
       ($1, 4, '08:00', '18:00', false),
       ($1, 5, '08:00', '18:00', false),
       ($1, 6, '08:00', '14:00', false)
     ON CONFLICT DO NOTHING`,
    [lojaId]
  );

  const { rows: novos } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento 
     WHERE loja_id = $1 
     ORDER BY dia_semana ASC`,
    [lojaId]
  );
  return novos;
}

export async function salvarHorariosNoBanco(
  lojaId: string,
  horarios: { dia_semana: number; hora_abertura: string; hora_fechamento: string; fechado: boolean }[]
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const h of horarios) {
      await client.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (loja_id, dia_semana) 
         DO UPDATE SET hora_abertura = $3, hora_fechamento = $4, fechado = $5`,
        [lojaId, h.dia_semana, h.hora_abertura, h.hora_fechamento, h.fechado]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function buscarHorariosFuncionamento(lojaId: string) {
  const { rows } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento WHERE loja_id = $1 ORDER BY dia_semana ASC`,
    [lojaId]
  );
  return rows;
}