// lib/slots.ts
import { listarBloqueiosParaSlots, listarOcupacoesParaSlots } from "./db/agendamentos";
import { buscarHorariosFuncionamento } from "./db/lojas";

type HorarioFuncionamento = {
  dia_semana: number;
  hora_abertura: string; // "HH:MM:SS"
  hora_fechamento: string;
  fechado: boolean;
};

const INTERVALO_SLOT_MINUTOS = 30;

/**
 * Calcula os horários livres de um dia específico para um serviço de X minutos.
 * Estratégia: gera slots de INTERVALO_SLOT_MINUTOS em minutos dentro do horário
 * de funcionamento do dia, e descarta os que colidem com algum agendamento
 * existente ou que não têm espaço suficiente para a duração do serviço.
 */
export async function calcularHorariosLivres(params: {
  lojaId: string;
  data: Date; // dia a consultar, em horário local
  duracaoServicoMinutos: number;
  antecedenciaMinimaMinutos: number;
}) {
  const { lojaId, data, duracaoServicoMinutos, antecedenciaMinimaMinutos } = params;

  const horarios = (await buscarHorariosFuncionamento(lojaId)) as HorarioFuncionamento[];
  const diaSemana = data.getDay();
  const horarioDoDia = horarios.find((h) => h.dia_semana === diaSemana);

  if (!horarioDoDia || horarioDoDia.fechado) return [];

  const inicioDia = combinarDataHora(data, horarioDoDia.hora_abertura);
  const fimDia = combinarDataHora(data, horarioDoDia.hora_fechamento);

  const ocupacoes = await listarOcupacoesParaSlots(lojaId, inicioDia, fimDia);
  const bloqueios = await listarBloqueiosParaSlots(lojaId, inicioDia, fimDia);
  const intervalosOcupados = [
    ...ocupacoes.map((o) => ({
      inicio: new Date(o.data_hora),
      fim: new Date(new Date(o.data_hora).getTime() + o.duracao_minutos * 60000),
    })),
    ...bloqueios.map((b) => ({ inicio: new Date(b.inicio), fim: new Date(b.fim) })),
  ];

  const agora = new Date();
  const limiteMinimo = new Date(agora.getTime() + antecedenciaMinimaMinutos * 60000);

  const slotsLivres: Date[] = [];
  let cursor = new Date(inicioDia);

  while (cursor.getTime() + duracaoServicoMinutos * 60000 <= fimDia.getTime()) {
    const fimSlot = new Date(cursor.getTime() + duracaoServicoMinutos * 60000);

    const colideComOcupacao = intervalosOcupados.some(
      (o) => cursor < o.fim && fimSlot > o.inicio
    );
    const respeitaAntecedencia = cursor >= limiteMinimo;

    if (!colideComOcupacao && respeitaAntecedencia) {
      slotsLivres.push(new Date(cursor));
    }

    cursor = new Date(cursor.getTime() + INTERVALO_SLOT_MINUTOS * 60000);
  }

  return slotsLivres;
}

export async function agendamentoDisponivel(params: {
  lojaId: string;
  inicio: Date;
  duracaoMinutos: number;
}) {
  const { lojaId, inicio, duracaoMinutos } = params;
  const horarios = (await buscarHorariosFuncionamento(lojaId)) as HorarioFuncionamento[];
  const diaSemana = inicio.getDay();
  const horarioDoDia = horarios.find((h) => h.dia_semana === diaSemana);

  if (!horarioDoDia || horarioDoDia.fechado) return false;

  const fim = new Date(inicio.getTime() + duracaoMinutos * 60000);
  const inicioDia = combinarDataHora(inicio, horarioDoDia.hora_abertura);
  const fimDia = combinarDataHora(inicio, horarioDoDia.hora_fechamento);

  if (inicio < inicioDia || fim > fimDia) return false;
  if (inicio.getTime() < Date.now()) return false;

  const ocupacoes = await listarOcupacoesParaSlots(lojaId, inicio, fim);
  if (ocupacoes.length > 0) return false;

  const bloqueios = await listarBloqueiosParaSlots(lojaId, inicio, fim);
  if (bloqueios.length > 0) return false;

  return true;
}

function combinarDataHora(data: Date, horaISO: string): Date {
  const [h, m, s] = horaISO.split(":").map(Number);
  const resultado = new Date(data);
  resultado.setHours(h, m, s ?? 0, 0);
  return resultado;
}
