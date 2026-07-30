"use server";
// lib/actions/slots.ts

import { calcularHorariosLivres } from "@/lib/slots";
import { pool } from "@/lib/db/client";

export async function buscarHorariosLivresAction(params: {
  lojaId: string;
  dataISO: string;
  duracaoServicoMinutos: number;
}) {
  const { rows } = await pool.query(
    `SELECT antecedencia_minima_minutos, fuso_horario FROM lojas WHERE id = $1`,
    [params.lojaId]
  );
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
}