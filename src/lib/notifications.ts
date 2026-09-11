import nodemailer from "nodemailer";
import { detectarCanal } from "@/lib/utils/contato";
import { enviarWhatsApp } from "@/lib/whatsapp/client";

const SMTP_HOST = process.env.EMAIL_SMTP_HOST;
const SMTP_PORT = process.env.EMAIL_SMTP_PORT ? Number(process.env.EMAIL_SMTP_PORT) : 587;
const SMTP_SECURE = process.env.EMAIL_SMTP_SECURE === "true";
const SMTP_USER = process.env.EMAIL_SMTP_USER;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

async function criarTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function enviarEmail(params: { email: string; assunto: string; mensagem: string }) {
  const smtp = await criarTransporter();
  if (smtp) {
    await smtp.sendMail({
      from: EMAIL_FROM,
      to: params.email,
      subject: params.assunto,
      text: params.mensagem,
    });
    return;
  }

  const url = process.env.EMAIL_API_URL;
  if (!url) {
    console.warn("[email] nenhum provedor de email configurado — mensagem não enviada:", params);
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.EMAIL_API_TOKEN ? { Authorization: `Bearer ${process.env.EMAIL_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      to: params.email,
      subject: params.assunto,
      text: params.mensagem,
    }),
  });
}

export async function enviarSms(params: { telefone: string; mensagem: string }) {
  const url = process.env.SMS_API_URL;
  if (!url) {
    console.warn("[sms] SMS_API_URL não configurada — mensagem não enviada:", params);
    return;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SMS_API_TOKEN ? { Authorization: `Bearer ${process.env.SMS_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      to: params.telefone,
      message: params.mensagem,
    }),
  });
}

export async function enviarMensagemContato(contato: string, assunto: string, mensagem: string) {
  const canal = detectarCanal(contato);

  if (canal === "whatsapp") {
    if (process.env.WHATSAPP_API_URL) {
      await enviarWhatsApp({ telefone: contato, mensagem });
      return;
    }

    if (process.env.SMS_API_URL) {
      await enviarSms({ telefone: contato, mensagem });
      return;
    }

    console.warn(
      "[notificacoes] Nenhum provedor de WhatsApp/SMS configurado — mensagem não enviada:",
      contato
    );
    await enviarWhatsApp({ telefone: contato, mensagem });
    return;
  }

  await enviarEmail({ email: contato, assunto, mensagem });
}

export async function enviarCodigoContato(contato: string, codigo: string) {
  const mensagem = `Seu código de verificação é ${codigo}. Use-o para acessar seus agendamentos.`;
  await enviarEmail({ email: contato, assunto: "Seu código de verificação", mensagem });
}
