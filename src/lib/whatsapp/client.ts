// lib/whatsapp/client.ts

/**
 * Camada de abstração para envio de WhatsApp. O provedor (Z-API, Twilio,
 * Meta Business API) ainda não foi definido — por isso essa função isola
 * o restante do app de qual provedor será usado. Quando decidir, só
 * implementar o fetch aqui dentro, sem mudar quem chama.
 */
export async function enviarWhatsApp(params: { telefone: string; mensagem: string }) {
  if (!process.env.WHATSAPP_API_URL) {
    console.warn("[whatsapp] WHATSAPP_API_URL não configurada — mensagem não enviada:", params);
    return;
  }

  await fetch(process.env.WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    },
    body: JSON.stringify({
      telefone: params.telefone,
      mensagem: params.mensagem,
    }),
  });
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
