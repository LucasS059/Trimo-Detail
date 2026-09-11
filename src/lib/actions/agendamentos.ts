"use server";

import { actionAutenticada, actionPublica, type ActionResponse } from "./utils";
import { revalidatePath } from "next/cache";
import { 
  criarAgendamento, 
  atualizarStatusAgendamento,
  criarBloqueioDb,
  excluirBloqueioDb,
  buscarAgendamento,
  type StatusAgendamento
} from "@/lib/db/agendamentos";
import { buscarOuCriarCliente, buscarClientePorContato } from "@/lib/db/clientes";
import { buscarLojaPorSlug } from "@/lib/db/lojas";

export async function criarAgendamentoPublico(dados: {
  lojaSlug: string;
  nome: string;
  telefone: string;
  email?: string | null;
  modeloVeiculo?: string; 
  placaVeiculo?: string;       
  corVeiculo?: string;
  servicosIds: string[];
  dataHora: Date;
  observacoes?: string;
}): Promise<ActionResponse<{ agendamentoId: string }>> {
  return actionPublica(async () => {
    const loja = await buscarLojaPorSlug(dados.lojaSlug);
    if (!loja) throw new Error("Loja não encontrada.");

    const clienteId = await buscarOuCriarCliente(loja.id, {
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email
    });

    let veiculoId: string | undefined = undefined;

    if (dados.modeloVeiculo) {
      try {
        const { criarVeiculo } = await import("@/lib/db/clientes");
        veiculoId = await criarVeiculo(clienteId, {
          modelo: dados.modeloVeiculo,
          placa: dados.placaVeiculo,
          cor: dados.corVeiculo
        });
      } catch (e) {
        console.error("Erro ao cadastrar veículo opcional:", e);
      }
    }

    const agendamentoId = await criarAgendamento({
      lojaId: loja.id,
      clienteId,
      veiculoId,
      servicosIds: dados.servicosIds,
      dataHora: dados.dataHora,
      observacoes: dados.observacoes,
    });

    // Disparo assíncrono resiliente de WhatsApp
    try {
      const { enviarWhatsApp, mensagemConfirmacaoAgendamento } = await import("@/lib/whatsapp/client");
      const { buscarServicosPorIds } = await import("@/lib/db/servicos");
      const servicos = await buscarServicosPorIds(dados.servicosIds, loja.id);
      const nomesServicos = servicos.map((s) => s.nome).join(", ");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const linkAcompanhamento = `${appUrl}/acompanhar/${agendamentoId}`;

      await enviarWhatsApp({
        telefone: dados.telefone,
        mensagem: mensagemConfirmacaoAgendamento({
          nomeCliente: dados.nome,
          servico: nomesServicos,
          dataHora: dados.dataHora,
          linkAcompanhamento,
        }),
      });
    } catch (msgErr) {
      console.warn("[whatsapp] Falha ao enviar confirmação de agendamento:", msgErr);
    }

    revalidatePath(`/${dados.lojaSlug}`);
    return { agendamentoId };
  });
}

export async function criarAgendamentoPeloAdmin(formData: FormData): Promise<ActionResponse<{ agendamentoId: string }>> {
  return actionAutenticada(async (lojaId) => {
    let clienteId = formData.get("clienteId") as string;
    const clienteNome = formData.get("clienteNome") as string;
    const clienteTelefone = formData.get("clienteTelefone") as string;
    const data = formData.get("data") as string;
    const hora = formData.get("hora") as string;
    const servicosIds = formData.getAll("servicosIds") as string[];
    const observacoes = (formData.get("observacoes") as string) || undefined;

    // Se o cliente não foi selecionado da lista, mas preencheu o formulário de novo cliente, cadastra-o ou localiza com segurança
    if (!clienteId && clienteNome && clienteTelefone) {
      const { buscarOuCriarCliente } = await import("@/lib/db/clientes");
      clienteId = await buscarOuCriarCliente(lojaId, {
        nome: clienteNome,
        telefone: clienteTelefone,
      });
    }

    if (!clienteId) {
      throw new Error("Cliente não informado ou selecionado.");
    }

    if (!data || !hora) {
      throw new Error("Data e hora são obrigatórias.");
    }

    const dataHora = new Date(`${data}T${hora}:00`);

    const agendamentoId = await criarAgendamento({
      lojaId,
      clienteId,
      servicosIds,
      dataHora,
      observacoes,
    });

    // Disparo assíncrono resiliente de WhatsApp
    try {
      if (clienteTelefone) {
        const { enviarWhatsApp, mensagemConfirmacaoAgendamento } = await import("@/lib/whatsapp/client");
        const { buscarServicosPorIds } = await import("@/lib/db/servicos");
        const servicos = await buscarServicosPorIds(servicosIds, lojaId);
        const nomesServicos = servicos.map((s) => s.nome).join(", ");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const linkAcompanhamento = `${appUrl}/acompanhar/${agendamentoId}`;

        await enviarWhatsApp({
          telefone: clienteTelefone,
          mensagem: mensagemConfirmacaoAgendamento({
            nomeCliente: clienteNome || "Cliente",
            servico: nomesServicos,
            dataHora,
            linkAcompanhamento,
          }),
        });
      }
    } catch (msgErr) {
      console.warn("[whatsapp] Falha ao enviar confirmação de agendamento admin:", msgErr);
    }

    revalidatePath("/(admin)/agenda");
    return { agendamentoId };
  });
}

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  em_andamento: "Em andamento (veículo na oficina)",
  aguardando_pagamento: "Serviço finalizado (aguardando retirada/pagamento)",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export async function mudarStatusAgendamento(id: string, status: StatusAgendamento): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(id, lojaId, status);

    // Disparo de notificação de status para o cliente
    try {
      const ag = await buscarAgendamento(id);
      if (ag && ag.cliente_telefone) {
        const { enviarWhatsApp, mensagemMudancaStatus } = await import("@/lib/whatsapp/client");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const linkAcompanhamento = `${appUrl}/acompanhar/${id}`;
        const statusLabel = STATUS_LABELS[status] || status;

        await enviarWhatsApp({
          telefone: ag.cliente_telefone,
          mensagem: mensagemMudancaStatus({
            nomeCliente: ag.cliente_nome,
            novoStatusLabel: statusLabel,
            linkAcompanhamento,
          }),
        });
      }
    } catch (msgErr) {
      console.warn("[whatsapp] Falha ao enviar mudança de status:", msgErr);
    }

    revalidatePath("/(admin)/agenda");
  });
}

export async function marcarNaoCompareceuPeloDono(id: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(id, lojaId, "nao_compareceu");
    revalidatePath("/(admin)/agenda");
  });
}

export async function enviarLembreteWhatsAppAction(id: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async () => {
    const ag = await buscarAgendamento(id);
    if (!ag) throw new Error("Agendamento não encontrado.");
    if (!ag.cliente_telefone) throw new Error("Cliente não possui telefone cadastrado.");

    const { enviarWhatsApp, mensagemLembretePresenca } = await import("@/lib/whatsapp/client");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const linkConfirmacao = `${appUrl}/acompanhar/${id}`;

    await enviarWhatsApp({
      telefone: ag.cliente_telefone,
      mensagem: mensagemLembretePresenca({
        nomeCliente: ag.cliente_nome,
        dataHora: new Date(ag.data_hora),
        linkConfirmacao,
      }),
    });
  });
}

export async function cancelarAgendamentoPeloDono(id: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(id, lojaId, "cancelado", {
      canceladoPor: "dono",
    });
    revalidatePath("/(admin)/agenda");
  });
}

export async function cancelarAgendamentoPeloCliente(id: string): Promise<ActionResponse<void>> {
  return actionPublica(async () => {
    const ag = await buscarAgendamento(id);
    if (!ag) throw new Error("Agendamento não encontrado.");

    if (ag.status === "cancelado") {
      throw new Error("Este agendamento já está cancelado.");
    }
    if (ag.status === "concluido") {
      throw new Error("Agendamentos concluídos não podem ser cancelados.");
    }
    if (ag.status !== "agendado") {
      throw new Error("Atendimento já iniciado. Entre em contato diretamente com a loja.");
    }

    // Validação de sessão do cliente
    const { obterContatoDaSessao } = await import("@/lib/auth/sessao-cliente");
    const contatoSessao = await obterContatoDaSessao(ag.loja_slug);
    if (!contatoSessao) {
      throw new Error("Sessão expirada. Acesse com seu telefone ou e-mail para gerenciar a reserva.");
    }

    const ehTitular =
      ag.cliente_telefone === contatoSessao ||
      ag.cliente_email === contatoSessao;

    if (!ehTitular) {
      throw new Error("Você não tem autorização para cancelar este agendamento.");
    }

    // Validação de prazo de cancelamento (ex: mínimo 60 minutos antes)
    const agoraMs = Date.now();
    const dataHoraMs = new Date(ag.data_hora).getTime();
    const prazoMinutos = Number(ag.prazo_cancelamento_minutos ?? 60);
    const limiteCancelamentoMs = dataHoraMs - prazoMinutos * 60 * 1000;

    if (agoraMs > limiteCancelamentoMs) {
      throw new Error(
        `O cancelamento online só é permitido com até ${prazoMinutos} minutos de antecedência. Entre em contato com a estética.`
      );
    }

    await atualizarStatusAgendamento(id, ag.loja_id, "cancelado", {
      canceladoPor: "cliente",
    });

    revalidatePath(`/${ag.loja_slug}/meus-agendamentos`);
    revalidatePath(`/acompanhar/${id}`);
    revalidatePath("/(admin)/agenda");
  });
}

export async function confirmarPresenca(id: string): Promise<ActionResponse<void>> {
  return actionPublica(async () => {
    const ag = await buscarAgendamento(id);
    if (!ag) throw new Error("Agendamento não encontrado.");

    const { obterContatoDaSessao } = await import("@/lib/auth/sessao-cliente");
    const contatoSessao = await obterContatoDaSessao(ag.loja_slug);
    if (!contatoSessao) {
      throw new Error("Sessão expirada. Identifique-se para confirmar presença.");
    }

    const ehTitular =
      ag.cliente_telefone === contatoSessao ||
      ag.cliente_email === contatoSessao;

    if (!ehTitular) {
      throw new Error("Apenas o titular pode confirmar presença neste agendamento.");
    }

    const { pool } = await import("@/lib/db/client");
    await pool.query(
      `UPDATE agendamentos SET presenca_confirmada = true, updated_at = now() WHERE id = $1`,
      [id]
    );

    revalidatePath(`/${ag.loja_slug}/meus-agendamentos`);
    revalidatePath(`/acompanhar/${id}`);
    revalidatePath("/(admin)/agenda");
  });
}

export async function criarBloqueioPeloAdmin(dados: { inicio: Date; fim: Date; motivo?: string }): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await criarBloqueioDb({
      lojaId,
      inicio: dados.inicio,
      fim: dados.fim,
      motivo: dados.motivo,
    });
    revalidatePath("/(admin)/agenda");
  });
}

export async function excluirBloqueioPeloAdmin(id: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await excluirBloqueioDb(id, lojaId);
    revalidatePath("/(admin)/agenda");
  });
}

export async function buscarAgendamentoPublicoAction(id: string) {
  return actionPublica(async () => {
    const agendamento = await buscarAgendamento(id);
    if (!agendamento) {
      throw new Error("Agendamento não encontrado.");
    }
    return agendamento;
  });
}

export async function finalizarComBaixaManual(
  agendamentoId: string,
  valor: number,
  detalhe: string
): Promise<ActionResponse<void>> {
  return actionAutenticada(async () => {
    const { registrarBaixaManual } = await import("@/lib/db/pagamentos");
    await registrarBaixaManual({ agendamentoId, valor, detalhe });

    // Notificação WhatsApp de conclusão do serviço e confirmação de pagamento
    try {
      const ag = await buscarAgendamento(agendamentoId);
      if (ag && ag.cliente_telefone) {
        const { enviarWhatsApp } = await import("@/lib/whatsapp/client");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const linkAcompanhamento = `${appUrl}/acompanhar/${agendamentoId}`;
        const servicosTexto = ag.servicos?.map((s: { nome: string }) => s.nome).join(", ") || "serviço";

        await enviarWhatsApp({
          telefone: ag.cliente_telefone,
          mensagem: `Olá, ${ag.cliente_nome}! Seu serviço (${servicosTexto}) foi concluído com sucesso e o pagamento registrado. Seu veículo está pronto! Acompanhe os detalhes: ${linkAcompanhamento}`,
        });
      }
    } catch (msgErr) {
      console.warn("[whatsapp] Falha ao enviar notificação de conclusão:", msgErr);
    }

    revalidatePath("/(admin)/agenda");
    revalidatePath("/(admin)/financeiro");
  });
}

export async function finalizarComPix(
  agendamentoId: string,
  valor: number
): Promise<ActionResponse<{ qrCodeBase64: string; copiaECola: string }>> {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    const { rows: intRows } = await pool.query(
      `SELECT mercadopago_access_token FROM loja_integracoes WHERE loja_id = $1`,
      [lojaId]
    );
    const accessToken = intRows[0]?.mercadopago_access_token;

    const ag = await buscarAgendamento(agendamentoId);
    if (!ag) throw new Error("Agendamento não encontrado.");

    if (!accessToken) {
      throw new Error(
        "Mercado Pago não configurado. Adicione o Access Token em Configurações > Integrações ou utilize Baixa Manual."
      );
    }

    const { gerarCobrancaPix } = await import("@/lib/mercadopago/client");
    const { registrarPagamentoPixPendente } = await import("@/lib/db/pagamentos");

    const emailPagador = ag.cliente_email || `cliente_${ag.codigo}@trimodetail.com.br`;
    const descricao = `Atendimento #${ag.codigo} - ${ag.loja_nome}`;

    const cobranca = await gerarCobrancaPix({
      valor,
      descricao,
      emailPagador,
      accessToken,
    });

    await registrarPagamentoPixPendente({
      agendamentoId,
      valor,
      mercadopagoPaymentId: cobranca.mercadopagoPaymentId,
      qrCodeBase64: cobranca.qrCodeBase64,
      copiaECola: cobranca.copiaECola,
      expiraEm: cobranca.expiraEm,
    });

    await pool.query(
      `UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`,
      [agendamentoId, lojaId]
    );

    revalidatePath("/(admin)/agenda");

    return {
      qrCodeBase64: cobranca.qrCodeBase64,
      copiaECola: cobranca.copiaECola,
    };
  });
}

export async function finalizarComPoint(
  agendamentoId: string,
  valor: number
): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    const { rows: intRows } = await pool.query(
      `SELECT mercadopago_access_token, mercadopago_device_id FROM loja_integracoes WHERE loja_id = $1`,
      [lojaId]
    );
    const accessToken = intRows[0]?.mercadopago_access_token;
    const deviceId = intRows[0]?.mercadopago_device_id;

    if (!accessToken || !deviceId) {
      throw new Error(
        "Dispositivo Point não configurado. Preencha o Token e o ID da Maquininha nas Configurações da Loja."
      );
    }

    const ag = await buscarAgendamento(agendamentoId);
    if (!ag) throw new Error("Agendamento não encontrado.");

    const { criarOrdemPoint } = await import("@/lib/mercadopago/client");
    const { registrarPagamentoPointPendente } = await import("@/lib/db/pagamentos");

    const ordem = await criarOrdemPoint({
      deviceId,
      valor,
      descricao: `Atendimento #${ag.codigo} - ${ag.loja_nome}`,
      accessToken,
    });

    await registrarPagamentoPointPendente({
      agendamentoId,
      valor,
      mercadopagoPaymentId: ordem.id ? String(ordem.id) : undefined,
    });

    await pool.query(
      `UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`,
      [agendamentoId, lojaId]
    );

    revalidatePath("/(admin)/agenda");
  });
}

/**
 * Busca um cliente pelo telefone ou email na loja especificada.
 * Retorna nome, email e lista de veículos para pré-preenchimento no checkout.
 */
export async function buscarClientePorContatoAction(
  slugLoja: string,
  contato: string
): Promise<ActionResponse<{ nome: string; email: string | null; veiculos: { id: string; modelo: string; placa: string | null; cor: string | null }[] } | null>> {
  return actionPublica(async () => {
    if (!contato || contato.trim().length < 4) return null;

    const loja = await buscarLojaPorSlug(slugLoja);
    if (!loja) return null;

    const cliente = await buscarClientePorContato(loja.id, contato.trim());
    if (!cliente) return null;

    return {
      nome: cliente.nome,
      email: cliente.email,
      veiculos: cliente.veiculos,
    };
  });
}