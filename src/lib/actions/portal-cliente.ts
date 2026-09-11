'use server';

import { pool } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';
import { normalizarPlaca } from '@/lib/utils/placa';

export async function atualizarDadosClientePeloPortalAction(params: {
  agendamentoId?: string;
  clienteId?: string;
  lojaId?: string;
  nome: string;
  email?: string | null;
}) {
  try {
    let clienteId = params.clienteId;
    if (!clienteId && params.agendamentoId) {
      const { rows: ag } = await pool.query(
        'SELECT cliente_id FROM agendamentos WHERE id = $1',
        [params.agendamentoId]
      );
      if (!ag.length) throw new Error('Agendamento não encontrado.');
      clienteId = ag[0].cliente_id;
    }

    if (!clienteId) throw new Error('Identificador do cliente não informado.');

    await pool.query(
      'UPDATE clientes SET nome = $1, email = $2, updated_at = now() WHERE id = $3',
      [params.nome.trim(), params.email?.trim() || null, clienteId]
    );

    if (params.agendamentoId) {
      revalidatePath(`/acompanhar/${params.agendamentoId}`);
    }
    return { sucesso: true };
  } catch (err) {
    return { sucesso: false, erro: err instanceof Error ? err.message : 'Erro ao atualizar dados.' };
  }
}

export async function adicionarVeiculoPeloPortalAction(params: {
  agendamentoId?: string;
  clienteId?: string;
  modelo: string;
  marca?: string | null;
  cor?: string | null;
  placa?: string | null;
  categoria?: string | null;
}): Promise<{
  sucesso: boolean;
  veiculo?: {
    id: string;
    modelo: string;
    marca?: string | null;
    placa: string;
    cor?: string | null;
    categoria?: string | null;
  };
  erro?: string;
}> {
  try {
    let clienteId = params.clienteId;
    if (!clienteId && params.agendamentoId) {
      const { rows: ag } = await pool.query(
        'SELECT cliente_id FROM agendamentos WHERE id = $1',
        [params.agendamentoId]
      );
      if (!ag.length) throw new Error('Agendamento não encontrado.');
      clienteId = ag[0].cliente_id;
    }

    if (!clienteId) throw new Error('Identificador do cliente não informado.');

    const placaNormalizada = params.placa ? normalizarPlaca(params.placa) : null;

    const { rows } = await pool.query(
      'INSERT INTO veiculos (cliente_id, modelo, cor, placa) VALUES ($1, $2, $3, $4) RETURNING id, modelo, cor, placa',
      [clienteId, params.modelo.trim(), params.cor?.trim() || null, placaNormalizada]
    );

    if (params.agendamentoId) {
      revalidatePath(`/acompanhar/${params.agendamentoId}`);
    }
    return {
      sucesso: true,
      veiculo: {
        id: rows[0].id,
        modelo: rows[0].modelo,
        marca: params.marca || null,
        placa: rows[0].placa || '',
        cor: rows[0].cor || null,
        categoria: params.categoria || null
      }
    };
  } catch (err) {
    return { sucesso: false, erro: err instanceof Error ? err.message : 'Erro ao adicionar veículo.' };
  }
}
