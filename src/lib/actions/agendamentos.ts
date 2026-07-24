"use server";

import {
  atualizarStatus,
  buscarAgendamento,
  cancelarAgendamento as cancelarAgendamentoDb,
  criarAgendamento as criarAgendamentoDb,
  marcarPresencaConfirmada,
  criarBloqueioDb,
} from "@/lib/db/agendamentos";
import { buscarOuCriarCliente } from "@/lib/db/clientes";
import {
  criarPagamentoPendente,
  registrarBaixaManual,
  buscarPixPendentePorAgendamento,
} from "@/lib/db/pagamentos";
import { buscarServico } from "@/lib/db/servicos";
import { buscarLojaPorSlug } from "@/lib/db/lojas";
import { gerarCobrancaPix } from "@/lib/mercadopago/client";
import {
  enviarWhatsApp,
  mensagemConfirmacaoAgendamento,
  mensagemMudancaStatus,
} from "@/lib/whatsapp/client";
import { revalidatePath } from "next/cache";
import { obterLojaLogadaId } from "@/lib/actions/auth";

const LABEL_STATUS: Record<string, string> = {
  agendado: "Agendado",
  em_andamento: "Em andamento",
  aguardando_pagamento: "Aguardando pagamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export async function criarAgendamentoPublico(params: {
  slugLoja: string;
  servicoId: string;
  dataHoraISO: string;
  nomeCliente: string;
  telefoneCliente: string;
}) {
  const loja = await buscarLojaPorSlug(params.slugLoja);
  if (!loja) throw new Error("Loja não encontrada");

  const servico = await buscarServico(params.servicoId, loja.id);
  if (!servico) throw new Error("Serviço não encontrado");

  const clienteId = await buscarOuCriarCliente(loja.id, {
    nome: params.nomeCliente,
    telefone: params.telefoneCliente,
  });

  const agendamentoId = await criarAgendamentoDb({
    lojaId: loja.id,
    clienteId,
    servicoId: servico.id,
    dataHora: new Date(params.dataHoraISO),
    duracaoMinutos: servico.duracao_minutos,
    valor: Number(servico.preco),
  });

  const linkAcompanhamento = `${process.env.NEXT_PUBLIC_APP_URL}/acompanhar/${agendamentoId}`;

  await enviarWhatsApp({
    telefone: params.telefoneCliente,
    mensagem: mensagemConfirmacaoAgendamento({
      nomeCliente: params.nomeCliente,
      servico: servico.nome,
      dataHora: new Date(params.dataHoraISO),
      linkAcompanhamento,
    }),
  });

  revalidatePath("/agenda");
  return { agendamentoId, linkAcompanhamento };
}

export async function mudarStatusAgendamento(agendamentoId: string, novoStatus: string) {
  await atualizarStatus(agendamentoId, novoStatus as never);

  const agendamento = await buscarAgendamento(agendamentoId);
  if (agendamento) {
    const linkAcompanhamento = `${process.env.NEXT_PUBLIC_APP_URL}/acompanhar/${agendamentoId}`;
    await enviarWhatsApp({
      telefone: agendamento.cliente_telefone,
      mensagem: mensagemMudancaStatus({
        nomeCliente: agendamento.cliente_nome,
        novoStatusLabel: LABEL_STATUS[novoStatus] ?? novoStatus,
        linkAcompanhamento,
      }),
    });
  }

  revalidatePath("/agenda");
}

export async function cancelarAgendamentoPeloCliente(agendamentoId: string) {
  const agendamento = await buscarAgendamento(agendamentoId);
  if (!agendamento) throw new Error("Agendamento não encontrado");

  const loja = await buscarLojaPorSlug(agendamento.loja_slug);
  if (!loja) throw new Error("Loja não encontrada");

  const prazoLimite = new Date(
    new Date(agendamento.data_hora).getTime() - loja.prazo_cancelamento_minutos * 60000
  );

  if (new Date() > prazoLimite) {
    throw new Error(
      `O prazo para cancelamento (até ${loja.prazo_cancelamento_minutos} minutos antes) já passou. Entre em contato diretamente com a loja.`
    );
  }

  await cancelarAgendamentoDb(agendamentoId, "cliente");
  revalidatePath(`/acompanhar/${agendamentoId}`);
}

export async function cancelarAgendamentoPeloDono(agendamentoId: string) {
  await cancelarAgendamentoDb(agendamentoId, "dono");
  revalidatePath("/agenda");
}

export async function confirmarPresenca(agendamentoId: string) {
  await marcarPresencaConfirmada(agendamentoId);
  revalidatePath(`/acompanhar/${agendamentoId}`);
}

/**
 * Finaliza o serviço com pagamento via Pix: reaproveita cobrança existente
 * (evita duplicidade no Mercado Pago) ou gera uma nova e persiste QR code,
 * copia-e-cola e expiração pra reexibição posterior.
 */
export async function finalizarComPix(agendamentoId: string) {
  const agendamento = await buscarAgendamento(agendamentoId);
  if (!agendamento) throw new Error("Agendamento não encontrado");

  const pixExistente = await buscarPixPendentePorAgendamento(agendamentoId);
  if (pixExistente && pixExistente.qr_code_base64) {
    return {
      qrCodeBase64: pixExistente.qr_code_base64 as string,
      copiaECola: pixExistente.copia_e_cola as string,
      expiraEm: pixExistente.expira_em as string,
    };
  }

  const loja = await buscarLojaPorSlug(agendamento.loja_slug);
  if (!loja || !loja.mercadopago_access_token) {
    throw new Error("A integração com o Mercado Pago não está configurada nesta loja.");
  }

  try {
    const cobranca = await gerarCobrancaPix({
      valor: Number(agendamento.valor),
      descricao: `${agendamento.servico_nome} - ${agendamento.cliente_nome}`,
      emailPagador: "cliente@exemplo.com",
      accessToken: loja.mercadopago_access_token,
    });

    await criarPagamentoPendente({
      agendamentoId,
      forma: "pix",
      valor: Number(agendamento.valor),
      mercadopagoPaymentId: cobranca.mercadopagoPaymentId,
      qrCodeBase64: cobranca.qrCodeBase64,
      copiaECola: cobranca.copiaECola,
      expiraEm: cobranca.expiraEm,
    });

    await atualizarStatus(agendamentoId, "aguardando_pagamento" as never);
    revalidatePath("/agenda");

    return {
      qrCodeBase64: cobranca.qrCodeBase64,
      copiaECola: cobranca.copiaECola,
      expiraEm: cobranca.expiraEm.toISOString(),
    };
  } catch (error: any) {
    console.error("Erro ao gerar Pix no Mercado Pago:", error);
    throw new Error(error.message || "Falha ao gerar cobrança Pix. Verifique as credenciais do Mercado Pago.");
  }
}

export async function finalizarComBaixaManual(params: {
  agendamentoId: string;
  detalhe: string;
}) {
  const agendamento = await buscarAgendamento(params.agendamentoId);
  if (!agendamento) throw new Error("Agendamento não encontrado");

  await registrarBaixaManual({
    agendamentoId: params.agendamentoId,
    valor: Number(agendamento.valor),
    detalhe: params.detalhe,
  });

  await atualizarStatus(params.agendamentoId, "concluido" as never);
  revalidatePath("/agenda");
}

export async function criarAgendamentoPeloAdmin(formData: FormData) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autorizado");

  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const servicoId = formData.get("servicoId") as string;
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;

  const dataHora = new Date(`${data}T${hora}:00`);

  const clienteId = await buscarOuCriarCliente(lojaId, { nome, telefone });

  const servico = await buscarServico(servicoId, lojaId);
  if (!servico) throw new Error("Serviço não encontrado");

  await criarAgendamentoDb({
    lojaId,
    clienteId,
    servicoId: servico.id,
    dataHora,
    duracaoMinutos: servico.duracao_minutos,
    valor: Number(servico.preco),
  });

  revalidatePath("/agenda");
}

export async function criarBloqueioPeloAdmin(formData: FormData) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) throw new Error("Não autorizado");

  const data = formData.get("data") as string;
  const horaInicio = formData.get("horaInicio") as string;
  const horaFim = formData.get("horaFim") as string;
  const motivo = formData.get("motivo") as string;

  const inicio = new Date(`${data}T${horaInicio}:00`);
  const fim = new Date(`${data}T${horaFim}:00`);

  await criarBloqueioDb({ lojaId, inicio, fim, motivo });

  revalidatePath("/agenda");
}