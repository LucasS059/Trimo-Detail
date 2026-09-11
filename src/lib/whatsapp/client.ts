import { normalizarTelefone } from "@/lib/utils/contato";

/**
 * Camada de envio de mensagens do WhatsApp.
 * Suporta nativamente:
 * 1. Evolution API (v2) - Open Source / Render
 * 2. Z-API
 * 3. Webhook HTTP genérico
 */
export async function enviarWhatsApp(params: { telefone: string; mensagem: string }) {
  const telefoneNormalizado = normalizarTelefone(params.telefone);

  // 1. Prioridade: Evolution API (v2)
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const evoInstance = process.env.EVOLUTION_INSTANCE_NAME || "trimo";

  if (evoUrl && evoKey) {
    const urlLimpa = evoUrl.replace(/\/$/, "");
    const endpoint = `${urlLimpa}/message/sendText/${evoInstance}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evoKey,
        },
        body: JSON.stringify({
          number: telefoneNormalizado,
          text: params.mensagem,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[whatsapp] Erro Evolution API (status ${res.status}):`, errText);
      }
      return;
    } catch (error) {
      console.error("[whatsapp] Falha de conexão com Evolution API:", error);
      return;
    }
  }

  // 2. Prioridade: Z-API
  const zapiInstanceId = process.env.ZAPI_INSTANCE_ID;
  const zapiToken = process.env.ZAPI_INSTANCE_TOKEN;
  const zapiClientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (zapiInstanceId && zapiToken) {
    const endpoint = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (zapiClientToken) {
      headers["Client-Token"] = zapiClientToken;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phone: telefoneNormalizado,
          message: params.mensagem,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[whatsapp] Erro Z-API (status ${res.status}):`, errText);
      }
      return;
    } catch (error) {
      console.error("[whatsapp] Falha de conexão com Z-API:", error);
      return;
    }
  }

  // 3. Fallback: URL HTTP Genérica
  if (process.env.WHATSAPP_API_URL) {
    try {
      await fetch(process.env.WHATSAPP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          telefone: telefoneNormalizado,
          mensagem: params.mensagem,
        }),
      });
    } catch (error) {
      console.error("[whatsapp] Erro ao enviar para WHATSAPP_API_URL:", error);
    }
    return;
  }

  console.warn("[whatsapp] Nenhum provedor de WhatsApp configurado no ambiente.");
}

export function mensagemConfirmacaoAgendamento(params: {
  nomeCliente: string;
  servico: string;
  dataHora: Date;
  linkAcompanhamento: string;
}) {
  const dataFormatada = params.dataHora.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return `Olá, ${params.nomeCliente}! Seu agendamento de ${params.servico} foi confirmado para ${dataFormatada}. Acompanhe pelo link: ${params.linkAcompanhamento}`;
}

export function mensagemMudancaStatus(params: {
  nomeCliente: string;
  novoStatusLabel: string;
  linkAcompanhamento: string;
}) {
  return `Olá, ${params.nomeCliente}! O status do seu agendamento mudou para: ${params.novoStatusLabel}. Acompanhe: ${params.linkAcompanhamento}`;
}

export function mensagemLembretePresenca(params: {
  nomeCliente: string;
  dataHora: Date;
  linkConfirmacao: string;
}) {
  const horaFormatada = params.dataHora.toLocaleString("pt-BR", { timeStyle: "short" });
  return `Olá, ${params.nomeCliente}! Seu agendamento é hoje às ${horaFormatada}. Confirme sua presença: ${params.linkConfirmacao}`;
}
