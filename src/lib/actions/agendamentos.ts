"use server";

import { actionAutenticada, actionPublica } from "./utils";
import { revalidatePath } from "next/cache";
import { 
  criarAgendamento, 
  atualizarStatusAgendamento,
  criarBloqueioDb,
  excluirBloqueioDb
} from "@/lib/db/agendamentos";
import { buscarOuCriarCliente } from "@/lib/db/clientes";
import { buscarLojaPorSlug } from "@/lib/db/lojas";

export async function criarAgendamentoPublico(dados: {
  lojaSlug: string;
  nome: string;
  telefone: string;
  modeloVeiculo?: string; 
  placaVeiculo?: string;       
  corVeiculo?: string;
  servicosIds: string[];
  dataHora: Date;
}) {
  return actionPublica(async () => {
    const loja = await buscarLojaPorSlug(dados.lojaSlug);
    if (!loja) throw new Error("Loja não encontrada.");

    const clienteId = await buscarOuCriarCliente(loja.id, {
      nome: dados.nome,
      telefone: dados.telefone,
    });

    let veiculoId: string | undefined = undefined;

    if (dados.modeloVeiculo) {
      try {
        const { criarVeiculo } = await import("@/lib/db/clientes");
        veiculoId = await criarVeiculo(clienteId, {
          modelo: dados.modeloVeiculo,
          placa: dados.placaVeiculo || undefined,
          cor: dados.corVeiculo || undefined,
        });
      } catch (err) {
        console.error("Aviso: Falha ao salvar veículo.", err);
      }
    }

    const agendamentoId = await criarAgendamento({
      lojaId: loja.id,
      clienteId,
      veiculoId, 
      servicosIds: dados.servicosIds,
      dataHora: new Date(dados.dataHora),
    });

    revalidatePath(`/${dados.lojaSlug}`);
    return agendamentoId;
  });
}

export async function mudarStatusAgendamento(agendamentoId: string, novoStatus: any) {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(agendamentoId, lojaId, novoStatus);
    revalidatePath("/(admin)/agenda");
  });
}

export async function cancelarAgendamentoPeloDono(agendamentoId: string) {
  return actionAutenticada(async (lojaId) => {
    await atualizarStatusAgendamento(agendamentoId, lojaId, "cancelado");
    revalidatePath("/(admin)/agenda");
  });
}

export async function criarAgendamentoPeloAdmin(formData: FormData) {
  return actionAutenticada(async (lojaId) => {
    // Agora recebemos o clienteId (se o admin selecionou na lista)
    const clienteIdForm = formData.get("clienteId") as string | null;
    const clienteNome = formData.get("clienteNome") as string;
    const clienteTelefone = formData.get("clienteTelefone") as string;
    const data = formData.get("data") as string;
    const hora = formData.get("hora") as string;
    const servicosIds = formData.getAll("servicosIds") as string[];

    if (!data || !hora || servicosIds.length === 0) {
      throw new Error("Preencha todos os campos obrigatórios (Data, Hora e Serviços).");
    }

    let clienteId = clienteIdForm;

    // Se o ID não veio, significa que o admin digitou um novo cliente manualmente
    if (!clienteId) {
      if (!clienteNome || !clienteTelefone) {
        throw new Error("Dados do cliente incompletos.");
      }
      clienteId = await buscarOuCriarCliente(lojaId, { 
        nome: clienteNome, 
        telefone: clienteTelefone 
      });
    }

    await criarAgendamento({
      lojaId,
      clienteId,
      servicosIds,
      dataHora: new Date(`${data}T${hora}:00`),
    });

    revalidatePath("/(admin)/agenda");
    
    // Retornamos sucesso explicitamente para que o toast.success do frontend funcione
    return { sucesso: true }; 
  });
}

export async function criarBloqueioPeloAdmin(formData: FormData) {
  return actionAutenticada(async (lojaId) => {
    const inicioISO = formData.get("inicioISO") as string;
    const fimISO = formData.get("fimISO") as string;
    const motivo = formData.get("motivo") as string;

    await criarBloqueioDb({
      lojaId,
      inicio: new Date(inicioISO),
      fim: new Date(fimISO),
      motivo
    });

    revalidatePath("/(admin)/agenda");
  });
}

export async function excluirBloqueioPeloAdmin(id: string) {
    return actionAutenticada(async (lojaId) => {
        await excluirBloqueioDb(id, lojaId);
        revalidatePath("/(admin)/agenda");
    });
}

export async function cancelarAgendamentoPeloCliente(agendamentoId: string) {
  return actionPublica(async () => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET status = 'cancelado', updated_at = now() WHERE id = $1`, [agendamentoId]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/acompanhar/${agendamentoId}`);
  });
}

export async function confirmarPresenca(agendamentoId: string) {
  return actionPublica(async () => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET presenca_confirmada = true, updated_at = now() WHERE id = $1`, [agendamentoId]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/acompanhar/${agendamentoId}`);
  });
}

export async function finalizarComBaixaManual(agendamentoId: string, valor: number, detalhe: string) {
  return actionAutenticada(async (lojaId) => {
    const { registrarBaixaManual } = await import("@/lib/db/pagamentos");
    await registrarBaixaManual({ agendamentoId, valor, detalhe });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/(admin)/agenda");
  });
}

export async function finalizarComPix(agendamentoId: string, valor: number) {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`, [agendamentoId, lojaId]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/(admin)/agenda");
    return { qrCodeBase64: "", copiaECola: "" };
  });
}

export async function finalizarComPoint(agendamentoId: string, valor: number) {
  return actionAutenticada(async (lojaId) => {
    const { pool } = await import("@/lib/db/client");
    await pool.query(`UPDATE agendamentos SET status = 'aguardando_pagamento', updated_at = now() WHERE id = $1 AND loja_id = $2`, [agendamentoId, lojaId]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/(admin)/agenda");
  });
}