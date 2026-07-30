import { listarBloqueiosParaSlots } from "./db/agendamentos";
import { buscarHorariosFuncionamento } from "./db/lojas";
import { addMinutes, isBefore, isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { pool } from "./db/client";

const INTERVALO_SLOT_MINUTOS = 30;
const FUSO_PADRAO = "America/Sao_Paulo";

export async function calcularHorariosLivres(params: {
  lojaId: string;
  data: Date;
  duracaoServicoMinutos: number;
  antecedenciaMinimaMinutos: number;
  fusoHorario?: string;
}) {
  const fuso = params.fusoHorario || FUSO_PADRAO;

  // 1. Converter a data buscada para o fuso da loja
  const dataLocal = toZonedTime(params.data, fuso);
  const diaSemana = dataLocal.getDay();
  const ano = dataLocal.getFullYear();
  const mes = (dataLocal.getMonth() + 1).toString().padStart(2, "0");
  const dia = dataLocal.getDate().toString().padStart(2, "0");

  // 2. Buscar o funcionamento da loja no banco
  const horarios = await buscarHorariosFuncionamento(params.lojaId);
  const funcionamentoHoje = horarios.find((h: any) => h.dia_semana === diaSemana);

  if (!funcionamentoHoje || funcionamentoHoje.fechado) {
    return []; // Loja fechada neste dia
  }

  if (!funcionamentoHoje.hora_abertura || !funcionamentoHoje.hora_fechamento) {
    console.error("[calcularHorariosLivres] Horário de funcionamento incompleto:", {
      lojaId: params.lojaId,
      diaSemana,
      funcionamentoHoje,
    });
    return [];
  }

  // 3. Definir Início e Fim do dia perfeitamente alinhados ao fuso da loja e convertidos para UTC
  // Colunas TIME do Postgres já vêm como "HH:MM:SS" — NÃO adicionar ":00" extra aqui.
  const inicioDiaLocalStr = `${ano}-${mes}-${dia}T${funcionamentoHoje.hora_abertura}`;
  const fimDiaLocalStr = `${ano}-${mes}-${dia}T${funcionamentoHoje.hora_fechamento}`;

  const inicioDiaUTC = fromZonedTime(inicioDiaLocalStr, fuso);
  const fimDiaUTC = fromZonedTime(fimDiaLocalStr, fuso);

  if (isNaN(inicioDiaUTC.getTime()) || isNaN(fimDiaUTC.getTime())) {
    console.error("[calcularHorariosLivres] Data inválida gerada:", {
      inicioDiaLocalStr,
      fimDiaLocalStr,
      fuso,
    });
    return [];
  }

  if (!isBefore(inicioDiaUTC, fimDiaUTC)) {
    console.error("[calcularHorariosLivres] Horário de abertura não é anterior ao de fechamento:", {
      inicioDiaUTC,
      fimDiaUTC,
    });
    return [];
  }

  // 4. Buscar agendamentos e bloqueios reais no banco
  const bloqueios = await listarBloqueiosParaSlots(params.lojaId, inicioDiaUTC, fimDiaUTC);

  const { rows: ocupacoes } = await pool.query(
    `SELECT data_hora, duracao_minutos FROM agendamentos 
     WHERE loja_id = $1 AND status <> 'cancelado' 
     AND data_hora >= $2 AND data_hora <= $3`,
    [params.lojaId, inicioDiaUTC.toISOString(), fimDiaUTC.toISOString()]
  );

  const agoraUTC = new Date();
  const limiteAntecedenciaUTC = addMinutes(agoraUTC, params.antecedenciaMinimaMinutos);
  const slotsLivres: Date[] = [];
  let cursor = inicioDiaUTC;

  // 5. Motor de Varredura de Slots
  while (addMinutes(cursor, params.duracaoServicoMinutos) <= fimDiaUTC) {
    const fimSlot = addMinutes(cursor, params.duracaoServicoMinutos);

    // Ignora horários no passado (respeitando antecedência mínima)
    if (isBefore(cursor, limiteAntecedenciaUTC)) {
      cursor = addMinutes(cursor, INTERVALO_SLOT_MINUTOS);
      continue;
    }

    // Checa colisão com bloqueios manuais do dono
    const conflitaBloqueio = bloqueios.some((b: any) => {
      const bInicio = new Date(b.inicio);
      const bFim = new Date(b.fim);
      return isBefore(cursor, bFim) && isAfter(fimSlot, bInicio);
    });

    // Checa colisão com agendamentos de outros clientes
    const conflitaAgendamento = ocupacoes.some((oc: any) => {
      const ocInicio = new Date(oc.data_hora);
      const ocFim = addMinutes(ocInicio, oc.duracao_minutos);
      return isBefore(cursor, ocFim) && isAfter(fimSlot, ocInicio);
    });

    if (!conflitaBloqueio && !conflitaAgendamento) {
      slotsLivres.push(cursor);
    }

    cursor = addMinutes(cursor, INTERVALO_SLOT_MINUTOS);
  }

  return slotsLivres;
}