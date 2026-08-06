import { pool } from "./client";

export type Loja = {
  id: string;
  codigo: number;
  slug: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
  fuso_horario: string;
  cor_primaria: string;
  ultimo_upload_imagem_at: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type LojaConfiguracoesAgenda = {
  antecedencia_minima_minutos: number;
  prazo_cancelamento_minutos: number;
  lembrete_confirmacao_minutos: number;
  dias_futuros_visiveis: number;
  updated_at: string;
};

export type LojaIntegracoes = {
  mercadopago_access_token: string | null;
  mercadopago_user_id: string | null;
  mercadopago_device_id: string | null;
  taxa_debito_percentual: number;
  taxa_credito_percentual: number;
  updated_at: string;
};

export type LojaDetalhes = Loja & LojaConfiguracoesAgenda & LojaIntegracoes & {
  tem_mercadopago_configurado: boolean;
};

export async function buscarLojaPorId(id: string): Promise<Loja | null> {
  const { rows } = await pool.query<Loja>(
    `SELECT id, codigo, slug, nome, descricao, imagem_url, endereco,
            fuso_horario, cor_primaria, ultimo_upload_imagem_at, ativo,
            created_at, updated_at
     FROM lojas WHERE id = $1 AND ativo = TRUE`,
    [id]
  );
  return rows[0] ?? null;
}

export async function buscarLojaPorSlug(slug: string): Promise<Loja | null> {
  const { rows } = await pool.query<Loja>(
    `SELECT id, codigo, slug, nome, descricao, imagem_url, endereco,
            fuso_horario, cor_primaria, ultimo_upload_imagem_at, ativo,
            created_at, updated_at
     FROM lojas WHERE slug = $1 AND ativo = TRUE`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function buscarLojaPorEmail(email: string) {
  const { rows } = await pool.query(
    `SELECT u.loja_id AS id, u.senha_hash, u.id AS usuario_id, u.cargo
     FROM loja_usuarios u
     JOIN lojas l ON l.id = u.loja_id
     WHERE u.email_login = $1 AND u.ativo = TRUE AND l.ativo = TRUE`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarConfiguracoesLoja(lojaId: string) {
  const { rows } = await pool.query<LojaDetalhes>(
    `SELECT l.id, l.codigo, l.slug, l.nome, l.descricao, l.imagem_url, l.endereco,
            l.fuso_horario, l.cor_primaria, l.ultimo_upload_imagem_at, l.ativo,
            l.created_at, l.updated_at,
            COALESCE(c.antecedencia_minima_minutos, 60) AS antecedencia_minima_minutos,
            COALESCE(c.prazo_cancelamento_minutos, 60) AS prazo_cancelamento_minutos,
            COALESCE(c.lembrete_confirmacao_minutos, 60) AS lembrete_confirmacao_minutos,
            COALESCE(c.dias_futuros_visiveis, 15) AS dias_futuros_visiveis,
            COALESCE(i.mercadopago_access_token, NULL) AS mercadopago_access_token,
            COALESCE(i.mercadopago_user_id, NULL) AS mercadopago_user_id,
            COALESCE(i.mercadopago_device_id, NULL) AS mercadopago_device_id,
            COALESCE(i.taxa_debito_percentual, 1.99) AS taxa_debito_percentual,
            COALESCE(i.taxa_credito_percentual, 4.98) AS taxa_credito_percentual,
            (i.mercadopago_access_token IS NOT NULL) AS tem_mercadopago_configurado
     FROM lojas l
     LEFT JOIN loja_configuracoes_agenda c ON c.loja_id = l.id
     LEFT JOIN loja_integracoes i ON i.loja_id = l.id
     WHERE l.id = $1 AND l.ativo = TRUE`,
    [lojaId]
  );
  return rows[0] ?? null;
}

export async function atualizarConfiguracoesLoja(lojaId: string, dados: Record<string, unknown>) {
  const lojaCampos = [
    "nome",
    "slug",
    "descricao",
    "imagem_url",
    "endereco",
    "fuso_horario",
    "cor_primaria",
    "ativo",
  ];
  const configuracoesCampos = [
    "antecedencia_minima_minutos",
    "prazo_cancelamento_minutos",
    "lembrete_confirmacao_minutos",
    "dias_futuros_visiveis",
  ];
  const integracoesCampos = [
    "mercadopago_access_token",
    "mercadopago_user_id",
    "mercadopago_device_id",
    "taxa_debito_percentual",
    "taxa_credito_percentual",
  ];

  const dadosLoja: Record<string, unknown> = {};
  const dadosConfiguracoes: Record<string, unknown> = {};
  const dadosIntegracoes: Record<string, unknown> = {};

  for (const [chave, valor] of Object.entries(dados)) {
    if (lojaCampos.includes(chave)) dadosLoja[chave] = valor;
    else if (configuracoesCampos.includes(chave)) dadosConfiguracoes[chave] = valor;
    else if (integracoesCampos.includes(chave)) dadosIntegracoes[chave] = valor;
  }

  if (Object.keys(dadosLoja).length > 0) {
    const chaves = Object.keys(dadosLoja);
    const setClause = chaves.map((chave, i) => `${chave} = $${i + 2}`).join(", ");
    const valores = Object.values(dadosLoja);

    await pool.query(
      `UPDATE lojas SET ${setClause}, updated_at = now() WHERE id = $1`,
      [lojaId, ...valores]
    );
  }

  if (Object.keys(dadosConfiguracoes).length > 0) {
    const chaves = Object.keys(dadosConfiguracoes);
    const valores = Object.values(dadosConfiguracoes);
    const setClause = chaves.map((chave, i) => `${chave} = $${i + 2}`).join(", ");

    await pool.query(
      `INSERT INTO loja_configuracoes_agenda (loja_id, ${chaves.join(", ")}, updated_at)
       VALUES ($1, ${chaves.map((_, i) => `$${i + 2}`).join(", ")}, now())
       ON CONFLICT (loja_id) DO UPDATE SET ${setClause}, updated_at = now()`,
      [lojaId, ...valores]
    );
  }

  if (Object.keys(dadosIntegracoes).length > 0) {
    const chaves = Object.keys(dadosIntegracoes);
    const valores = Object.values(dadosIntegracoes);
    const setClause = chaves.map((chave, i) => `${chave} = $${i + 2}`).join(", ");

    await pool.query(
      `INSERT INTO loja_integracoes (loja_id, ${chaves.join(", ")}, updated_at)
       VALUES ($1, ${chaves.map((_, i) => `$${i + 2}`).join(", ")}, now())
       ON CONFLICT (loja_id) DO UPDATE SET ${setClause}, updated_at = now()`,
      [lojaId, ...valores]
    );
  }
}

export async function obterOuCriarHorariosFuncionamento(lojaId: string) {
  const { rows: existentes } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM loja_horarios
     WHERE loja_id = $1
     ORDER BY dia_semana ASC`,
    [lojaId]
  );

  if (existentes.length > 0) return existentes;

  await pool.query(
    `INSERT INTO loja_horarios (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
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
     FROM loja_horarios 
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
        `INSERT INTO loja_horarios (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
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
     FROM loja_horarios WHERE loja_id = $1 ORDER BY dia_semana ASC`,
    [lojaId]
  );
  return rows;
}