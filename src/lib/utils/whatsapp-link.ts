export function limparTelefoneParaWhatsApp(telefone: string): string {
  const apenasNumeros = telefone.replace(/\D/g, "");
  // Se não tem DDI 55 (Brasil) e tem 10 ou 11 dígitos, adiciona 55
  if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
    return `55${apenasNumeros}`;
  }
  return apenasNumeros;
}

export function gerarLinkWhatsApp(telefone: string, mensagem?: string): string {
  const numero = limparTelefoneParaWhatsApp(telefone);
  if (!numero) return "#";
  const textoEncoded = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${textoEncoded}`;
}

export function gerarMensagemProntaWhatsApp(tipo: "lembrete" | "iniciado" | "pronto" | "geral", params: {
  nomeCliente: string;
  lojaNome?: string;
  horario?: string;
  servicos?: string;
}): string {
  const loja = params.lojaNome ? ` da ${params.lojaNome}` : "";

  switch (tipo) {
    case "lembrete":
      return `Olá, ${params.nomeCliente}! Passando para lembrar do seu agendamento${loja}${params.horario ? ` hoje às ${params.horario}` : ""}. Qualquer dúvida ou necessidade de ajuste, estamos à disposição!`;
    case "iniciado":
      return `Olá, ${params.nomeCliente}! O atendimento do seu veículo já foi iniciado${loja}. Avisaremos assim que o serviço estiver finalizado!`;
    case "pronto":
      return `Olá, ${params.nomeCliente}! Seu veículo está pronto para retirada${loja}! Ficou impecável. Aguardamos você!`;
    default:
      return `Olá, ${params.nomeCliente}! Aqui é${loja}. Como podemos te ajudar?`;
  }
}

