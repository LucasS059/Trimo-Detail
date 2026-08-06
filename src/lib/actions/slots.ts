"use server";
// lib/actions/slots.ts

import { calcularHorariosLivres } from "@/lib/slots";
import { pool } from "@/lib/db/client";
import { actionPublica } from "./utils";

export async function buscarHorariosLivresAction(params: {
  lojaId: string;
  dataISO: string;
  duracaoServicoMinutos: number;
}) {
  return actionPublica(async () => {
    const { rows } = await pool.query(
      `SELECT COALESCE(c.antecedencia_minima_minutos, 60) AS antecedencia_minima_minutos,
              l.fuso_horario
       FROM lojas l
       LEFT JOIN loja_configuracoes_agenda c ON c.loja_id = l.id
       WHERE l.id = $1 AND l.ativo = TRUE`,
      [params.lojaId]
    );
    
    if (rows.length === 0) {
      throw new Error("Loja não encontrada ou inativa.");
    }

    const antecedenciaMinima = rows[0]?.antecedencia_minima_minutos ?? 60;
    const fusoHorario = rows[0]?.fuso_horario ?? "America/Sao_Paulo";

    const horarios = await calcularHorariosLivres({
      lojaId: params.lojaId,
      data: new Date(params.dataISO),
      duracaoServicoMinutos: params.duracaoServicoMinutos,
      antecedenciaMinimaMinutos: antecedenciaMinima,
      fusoHorario,
    });

    return horarios.map((h) => h.toISOString());
  });
}