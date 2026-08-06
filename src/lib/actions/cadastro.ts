"use server";
// lib/actions/cadastro.ts

import bcrypt from "bcryptjs";
import { pool } from "@/lib/db/client";
import { cookies } from "next/headers";

const COOKIE_NOME = "trimo_session";

function normalizarSlug(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function slugDisponivel(slugBruto: string) {
  const slug = normalizarSlug(slugBruto);
  if (!slug) return false;

  const { rows } = await pool.query(`SELECT 1 FROM lojas WHERE slug = $1 AND ativo = TRUE`, [slug]);
  return rows.length === 0;
}

export async function cadastrarLoja(dados: {
  nome: string;
  slug: string;
  nomeDono?: string;
  emailLogin: string;
  senha: string;
}) {
  const slug = normalizarSlug(dados.slug);

  if (!dados.nome || !slug || !dados.emailLogin || !dados.senha) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }
  if (dados.senha.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verifica se o e-mail de login já está em uso na tabela de usuários
    const emailCheck = await client.query(
      `SELECT 1 FROM loja_usuarios WHERE email_login = $1`,
      [dados.emailLogin]
    );
    if (emailCheck.rows.length > 0) {
      throw new Error("Já existe uma conta com esse e-mail.");
    }

    // Verifica se o slug já existe
    const slugCheck = await client.query(
      `SELECT 1 FROM lojas WHERE slug = $1`,
      [slug]
    );
    if (slugCheck.rows.length > 0) {
      throw new Error("Este slug (endereço da loja) já está em uso.");
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    // 1. Cria a loja (vitrine base)
    const { rows: lojaRows } = await client.query(
      `INSERT INTO lojas (nome, slug)
       VALUES ($1, $2)
       RETURNING id`,
      [dados.nome, slug]
    );
    const lojaId = lojaRows[0].id as string;

    // 2. Cria o usuário administrador da loja
    await client.query(
      `INSERT INTO loja_usuarios (loja_id, nome, email_login, senha_hash, cargo)
       VALUES ($1, $2, $3, $4, 'dono')`,
      [lojaId, dados.nomeDono || dados.nome, dados.emailLogin, senhaHash]
    );

    // 3. Inicializa as configurações de agenda padrão
    await client.query(
      `INSERT INTO loja_configuracoes_agenda (loja_id) VALUES ($1)`,
      [lojaId]
    );

    // 4. Inicializa as integrações vazias
    await client.query(
      `INSERT INTO loja_integracoes (loja_id) VALUES ($1)`,
      [lojaId]
    );

    // 5. Cria a assinatura gratuita inicial
    await client.query(
      `INSERT INTO loja_assinaturas (loja_id, plano, status) VALUES ($1, 'gratuito', 'ativo')`,
      [lojaId]
    );

    // 6. Horário de funcionamento padrão: segunda a sábado 08h-18h, domingo fechado.
    for (let diaSemana = 0; diaSemana <= 6; diaSemana++) {
      const fechado = diaSemana === 0;
      await client.query(
        `INSERT INTO loja_horarios (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, '08:00', '18:00', $3)`,
        [lojaId, diaSemana, fechado]
      );
    }

    await client.query("COMMIT");

    // Faz o login automático após o cadastro bem-sucedido
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NOME, lojaId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return { sucesso: true, slug };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}