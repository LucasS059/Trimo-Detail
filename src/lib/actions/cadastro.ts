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

  const { rows } = await pool.query(`SELECT 1 FROM lojas WHERE slug = $1`, [slug]);
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

    const existente = await client.query(
      `SELECT 1 FROM lojas WHERE slug = $1 OR email_login = $2`,
      [slug, dados.emailLogin]
    );
    if (existente.rows.length > 0) {
      throw new Error("Já existe uma loja com esse link ou e-mail.");
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const { rows } = await client.query(
      `INSERT INTO lojas (nome, slug, nome_dono, email_login, senha_hash, plano)
       VALUES ($1, $2, $3, $4, $5, 'gratuito')
       RETURNING id`,
      [dados.nome, slug, dados.nomeDono || null, dados.emailLogin, senhaHash]
    );
    const lojaId = rows[0].id as string;

    // Horário de funcionamento padrão: segunda a sábado 08h-18h, domingo fechado.
    // O dono ajusta depois em Configurações.
    for (let diaSemana = 0; diaSemana <= 6; diaSemana++) {
      const fechado = diaSemana === 0;
      await client.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, '08:00', '18:00', $3)`,
        [lojaId, diaSemana, fechado]
      );
    }

    await client.query("COMMIT");

    // já loga automaticamente após o cadastro
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NOME, lojaId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return { lojaId, slug };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
