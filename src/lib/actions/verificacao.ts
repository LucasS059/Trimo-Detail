"use server";

import crypto from "crypto";
import { pool } from "@/lib/db/client";
import { normalizarContato, detectarCanal } from "@/lib/utils/contato";
import { criarSessaoCliente } from "@/lib/auth/sessao-cliente";

const EXPIRACAO_MINUTOS = 10;
const INTERVALO_MINIMO_MS = 60 * 1000; // 1 minuto entre cliques
const MAX_CHANCES_ENVIO = 5;
const TEMPO_BLOQUEIO_MINUTOS = 5; 
const MAX_TENTATIVAS_ERRO = 5;

export async function solicitarCodigoAction(contatoDigitado: string) {
  const canal = detectarCanal(contatoDigitado);
  const contato = normalizarContato(contatoDigitado, canal);

  if (canal === "whatsapp" && contato.length < 12) throw new Error("Telefone inválido.");
  if (canal === "email" && !contato.includes("@")) throw new Error("E-mail inválido.");

  const codigo = crypto.randomInt(100000, 999999).toString();
  const expiraEm = new Date(Date.now() + EXPIRACAO_MINUTOS * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Bloqueia a linha específica para leitura/atualização segura (Prevenção de concorrência)
    const { rows } = await client.query(
      `SELECT id, created_at, tentativas_envio FROM codigos_verificacao WHERE contato = $1 FOR UPDATE`,
      [contato]
    );

    const registro = rows[0];

    if (registro) {
      const tempoDesdeUltimoEnvio = Date.now() - new Date(registro.created_at).getTime();

      // 1. Proteção contra cliques duplos / spam
      if (tempoDesdeUltimoEnvio < INTERVALO_MINIMO_MS) {
        throw new Error("Aguarde 1 minuto antes de pedir um novo código.");
      }

      let novasTentativasEnvio = registro.tentativas_envio + 1;

      // 2. Proteção de Limite (5 envios)
      if (registro.tentativas_envio >= MAX_CHANCES_ENVIO) {
        const minutosPassados = tempoDesdeUltimoEnvio / (60 * 1000);
        
        if (minutosPassados < TEMPO_BLOQUEIO_MINUTOS) {
          const minutosRestantes = Math.ceil(TEMPO_BLOQUEIO_MINUTOS - minutosPassados);
          throw new Error(`Limite de tentativas atingido. Aguarde ${minutosRestantes} minutos.`);
        }
        
        // Se já cumpriu o castigo de 5 minutos, reseta as fichas para 1
        novasTentativasEnvio = 1;
      }

      // 3. Atualiza a linha existente (reaproveitando o registro)
      await client.query(
        `UPDATE codigos_verificacao 
         SET codigo = $1, 
             expira_em = $2, 
             usado = false, 
             tentativas = 0, 
             tentativas_envio = $3, 
             created_at = now() 
         WHERE id = $4`,
        [codigo, expiraEm.toISOString(), novasTentativasEnvio, registro.id]
      );

    } else {
      // 4. Se o contato nunca pediu código antes, cria a linha única dele
      await client.query(
        `INSERT INTO codigos_verificacao (contato, canal, codigo, expira_em, tentativas_envio, created_at)
         VALUES ($1, $2, $3, $4, 1, now())`,
        [contato, canal, codigo, expiraEm.toISOString()]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // 5. Dispara o envio real conforme o canal detectado
  if (canal === "whatsapp") {
    await enviarCodigoWhatsApp(contato, codigo);
  } else {
    await enviarCodigoEmail(contato, codigo);
  }

  return { canal, contato };
}

export async function validarCodigoAction(contatoDigitado: string, codigoDigitado: string, slug: string) {
  const canal = detectarCanal(contatoDigitado);
  const contato = normalizarContato(contatoDigitado, canal);

  const { rows } = await pool.query(
    `SELECT * FROM codigos_verificacao
     WHERE contato = $1 AND usado = false AND expira_em > now()`,
    [contato]
  );
  const registro = rows[0];
  
  if (!registro) throw new Error("Código expirado ou inválido. Solicite um novo.");

  if (registro.tentativas >= MAX_TENTATIVAS_ERRO) {
    throw new Error("Muitas tentativas erradas. Solicite um novo código.");
  }

  const confere = codigoDigitado === registro.codigo;
  if (!confere) {
    await pool.query(`UPDATE codigos_verificacao SET tentativas = tentativas + 1 WHERE id = $1`, [registro.id]);
    throw new Error("Código incorreto.");
  }

  await pool.query(`UPDATE codigos_verificacao SET usado = true WHERE id = $1`, [registro.id]);

  await criarSessaoCliente(contato, slug);

  return { contato };
}

async function enviarCodigoWhatsApp(telefone: string, codigo: string) {
  const url = process.env.WHATSAPP_API_URL;
  if (!url) {
    console.log(`[whatsapp] WHATSAPP_API_URL não configurada — código não enviado: ${telefone} = ${codigo}`);
    return;
  }
  // integração real com API de WhatsApp
}

async function enviarCodigoEmail(email: string, codigo: string) {
  const url = process.env.EMAIL_API_URL;
  if (!url) {
    console.log(`[email] EMAIL_API_URL não configurada — código não enviado: ${email} = ${codigo}`);
    return;
  }
  // integração real com API de E-mail
}