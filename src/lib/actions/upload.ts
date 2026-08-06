"use server";

import { put } from "@vercel/blob";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/client";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const INTERVALO_MINIMO_MS = 10_000;

export async function uploadImagemLojaAction(formData: FormData) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autenticado");

  const { rows } = await pool.query(
    `SELECT ultimo_upload_imagem_at, slug, imagem_url FROM lojas WHERE id = $1 AND ativo = TRUE`,
    [lojaId]
  );
  const loja = rows[0];
  if (!loja) throw new Error("Loja não encontrada.");

  if (loja.ultimo_upload_imagem_at) {
    const desdeUltimoUpload = Date.now() - new Date(loja.ultimo_upload_imagem_at).getTime();
    if (desdeUltimoUpload < INTERVALO_MINIMO_MS) {
      throw new Error("Aguarde alguns segundos antes de enviar outra imagem.");
    }
  }

  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) {
    throw new Error("Nenhum arquivo enviado.");
  }
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("Imagem muito grande. Máximo de 4MB.");
  }

  const extensao = arquivo.name.split(".").pop();
  const nomeArquivo = `lojas/${lojaId}-${crypto.randomUUID()}.${extensao}`;

  const blob = await put(nomeArquivo, arquivo, {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  await pool.query(
    `UPDATE lojas SET imagem_url = $1, ultimo_upload_imagem_at = now(), updated_at = now() WHERE id = $2`,
    [blob.url, lojaId]
  );

  revalidatePath(`/${loja.slug}`);
  revalidatePath("/configuracoes");

  return { url: blob.url };
}