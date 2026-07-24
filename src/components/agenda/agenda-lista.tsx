"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { AgendamentoAcoes } from "@/components/agenda/agendamento-acoes";

type Agendamento = {
  id: string;
  data_hora: string;
  status: string;
  valor: string;
  cliente_nome: string;
  servico_nome: string;
  veiculo_modelo: string | null;
  pix_qr_code: string | null;
  pix_copia_cola: string | null;
  pix_expira_em: string | null;
};

const COR_BARRA_STATUS: Record<string, string> = {
  agendado: "bg-zinc-300",
  em_andamento: "bg-blue-400",
  aguardando_pagamento: "bg-amber-400",
  concluido: "bg-emerald-400",
  cancelado: "bg-zinc-200",
  nao_compareceu: "bg-red-300",
};

export function AgendaLista({
  agendamentos,
  dataAtual,
}: {
  agendamentos: Agendamento[];
  dataAtual: string;
}) {
  const router = useRouter();

  const [year, month, day] = dataAtual.split("-").map(Number);
  const dataSelecionada = new Date(year, month - 1, day);

  function mudarDia(deltaDias: number) {
    const nova = new Date(dataSelecionada);
    nova.setDate(nova.getDate() + deltaDias);
    router.push(`/agenda?data=${nova.toLocaleDateString("en-CA")}`);
  }

  function irParaHoje() {
    const hoje = new Date();
    router.push(`/agenda?data=${hoje.toLocaleDateString("en-CA")}`);
  }

  function selecionarData(dateObj: Date) {
    router.push(`/agenda?data=${dateObj.toLocaleDateString("en-CA")}`);
  }

  function gerarDiasDaSemana() {
    const dias = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(dataSelecionada);
      d.setDate(dataSelecionada.getDate() + i);
      dias.push(d);
    }
    return dias;
  }

  const diasSemana = gerarDiasDaSemana();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => mudarDia(-1)}
            className="w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-sm"
            title="Dia anterior"
          >
            ←
          </button>

          <button
            onClick={irParaHoje}
            className="px-4 py-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-700 transition-colors shadow-sm"
          >
            Hoje
          </button>

          <button
            onClick={() => mudarDia(1)}
            className="w-10 h-10 flex items-center justify-center border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 transition-colors shadow-sm"
            title="Próximo dia"
          >
            →
          </button>
        </div>

        <div className="text-base font-bold text-zinc-900 capitalize">
          {dataSelecionada.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-8">
        {diasSemana.map((d) => {
          const isSelected = d.toDateString() === dataSelecionada.toDateString();
          const nomeDia = d.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
          const numeroDia = d.getDate();

          return (
            <button
              key={d.toISOString()}
              onClick={() => selecionarData(d)}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                isSelected
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <span className={`text-[11px] font-bold tracking-wider mb-1 ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                {nomeDia}
              </span>
              <span className="text-lg sm:text-xl font-black">{numeroDia}</span>
            </button>
          );
        })}
      </div>

      {agendamentos.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Nenhum agendamento para esse dia.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {agendamentos.map((ag) => (
            <div
              key={ag.id}
              className="relative bg-white border border-zinc-200 rounded-2xl pl-6 pr-5 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden"
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${COR_BARRA_STATUS[ag.status] ?? "bg-zinc-300"}`} />

              <div className="flex items-start gap-6">
                <div className="min-w-[70px]">
                  <span className="text-lg font-black text-zinc-900 font-mono tabular-nums block">
                    {new Date(ag.data_hora).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-zinc-900 text-base">{ag.cliente_nome}</span>
                    <StatusBadge status={ag.status} />
                  </div>

                  <p className="text-sm font-medium text-zinc-600">
                    {ag.servico_nome}
                    {ag.veiculo_modelo ? ` • ${ag.veiculo_modelo}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                <div className="text-right w-full sm:w-auto">
                  <span className="text-lg font-black text-zinc-900 font-mono block">
                    R$ {Number(ag.valor).toFixed(2).replace(".", ",")}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <AgendamentoAcoes
                    agendamentoId={ag.id}
                    status={ag.status}
                    pixExistente={
                      ag.pix_qr_code
                        ? { qrCodeBase64: ag.pix_qr_code, copiaECola: ag.pix_copia_cola ?? undefined, expiraEm: ag.pix_expira_em }
                        : null
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}