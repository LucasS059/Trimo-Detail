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
import { buscarOuCriarCliente } from "@/lib/db/clientes";
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
      dataHora: dados.dataHora
    });

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

    // Se o cliente não foi selecionado da lista, mas preencheu o formulário de novo cliente, cadastra-o na hora
    if (!clienteId && clienteNome && clienteTelefone) {
      const { criarCliente } = await import("@/lib/db/clientes");
      clienteId = await criarCliente(lojaId, {
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
    });

    revalidatePath("/(admin)/agenda");
    return { agendamentoId };
  });
}

export async function mudarStatusAgendamento(id: string, status: StatusAgendamento): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(id, lojaId, status);
    revalidatePath("/(admin)/agenda");
  });
}

export async function cancelarAgendamentoPeloDono(id: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(id, lojaId, "cancelado");
    revalidatePath("/(admin)/agenda");
  });
}

export async function cancelarAgendamentoPeloCliente(id: string): Promise<ActionResponse<void>> {
  return actionPublica(async () => {
    const ag = await buscarAgendamento(id);
    if (!ag) throw new Error("Agendamento não encontrada.");
    await atualizarStatusAgendamento(id, ag.loja_id, "cancelado");
    revalidatePath(`/acompanhar/${id}`);
  });
}

export async function confirmarPresenca(id: string): Promise<ActionResponse<void>> {
  return actionPublica(async () => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET presenca_confirmada = true, updated_at = now() WHERE id = $1`, [id]);
    revalidatePath(`/acompanhar/${id}`);
  });
}

export async function criarBloqueioPeloAdmin(dados: { inicio: Date; fim: Date; motivo?: string }): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    await criarBloqueioDb({
      lojaId,
      inicio: dados.inicio,
      fim: dados.fim,
      motivo: dados.motivo
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

export async function finalizarComBaixaManual(agendamentoId: string, valor: number, detalhe: string): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const { registrarBaixaManual } = await import("@/lib/db/pagamentos");
    await registrarBaixaManual({ agendamentoId, valor, detalhe });
    revalidatePath("/(admin)/agenda");
  });
}

export async function finalizarComPix(agendamentoId: string, valor: number): Promise<ActionResponse<{ qrCodeBase64: string, copiaECola: string }>> {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`, [agendamentoId, lojaId]);
    revalidatePath("/(admin)/agenda");
    // TODO: Chamar o Mercado Pago e gerar o PIX de verdade.
    // O código abaixo é um mock para desenvolvimento.
    return { qrCodeBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", copiaECola: "00020126..." };
  });
}

export async function finalizarComPoint(agendamentoId: string, valor: number): Promise<ActionResponse<void>> {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`, [agendamentoId, lojaId]);
    revalidatePath("/(admin)/agenda");
  });
}