"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { AgendamentoModal, type AgendamentoDetalhe } from "@/components/agenda/agendamento-detalhe-modal";

// --- estilos reaproveitados, isolados do JSX ---
const cx = {
  diaBotao: "relative py-2.5 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5",
  card: "w-full text-left bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-zinc-600 transition-colors",
  horario: "text-xl font-bold text-white font-mono tabular-nums block leading-none",
  navBotao:
    "w-9 h-9 flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors",
};

export function AgendaLista({
  agendamentos,
  dataAtual,
}: {
  agendamentos: AgendamentoDetalhe[];
  dataAtual: string;
}) {
  const router = useRouter();
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const [year, month, day] = dataAtual.split("-").map(Number);
  const dataSelecionada = new Date(year, month - 1, day);
  const hoje = new Date();
  const ehHoje = dataSelecionada.toDateString() === hoje.toDateString();

  function mudarDia(deltaDias: number) {
    const nova = new Date(dataSelecionada);
    nova.setDate(nova.getDate() + deltaDias);
    router.push(`/agenda?data=${nova.toLocaleDateString("en-CA")}`);
  }

  function irParaHoje() {
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
  const agendamentosValidos = agendamentos.filter((a) => a.status !== "cancelado");
  const totalDoDia = agendamentosValidos.reduce((soma, a) => soma + Number(a.valor), 0);
  const aguardandoPagamento = agendamentosValidos.filter((a) => a.status === "aguardando_pagamento").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => mudarDia(-1)} className={cx.navBotao} title="Dia anterior">
            ‹
          </button>

          <div>
            <h2 className="text-[15px] font-bold text-white capitalize leading-tight">
              {dataSelecionada.toLocaleDateString("pt-BR", { weekday: "long" })}
            </h2>
            <p className="text-xs font-medium text-zinc-400 leading-tight">
              {dataSelecionada.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          <button onClick={() => mudarDia(1)} className={cx.navBotao} title="Próximo dia">
            ›
          </button>

          {!ehHoje && (
            <button
              onClick={irParaHoje}
              className="ml-1 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      {/* Resumo do dia — o que o dono quer ver de cara */}
      {agendamentosValidos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Previsto no dia</p>
            <p className="text-xl font-black text-white font-mono tabular-nums mt-0.5">
              R$ {totalDoDia.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Carros agendados</p>
            <p className="text-xl font-black text-white font-mono tabular-nums mt-0.5">
              {agendamentosValidos.length}
            </p>
          </div>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Aguardando pagto.</p>
            <p className={`text-xl font-black font-mono tabular-nums mt-0.5 ${aguardandoPagamento > 0 ? "text-[#E56B25]" : "text-white"}`}>
              {aguardandoPagamento}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 mb-8">
        {diasSemana.map((d) => {
          const isSelected = d.toDateString() === dataSelecionada.toDateString();
          const isHoje = d.toDateString() === hoje.toDateString();
          const nomeDia = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);

          return (
            <button
              key={d.toISOString()}
              onClick={() => selecionarData(d)}
              className={`${cx.diaBotao} ${
                isSelected
                  ? "bg-[#E56B25] text-white"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "text-white/70" : "text-zinc-500"}`}>
                {nomeDia}
              </span>
              <span className="text-base font-bold tabular-nums">{d.getDate()}</span>
              {isHoje && !isSelected && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#E56B25]" />}
            </button>
          );
        })}
      </div>

      {agendamentos.length === 0 ? (
        <div className="bg-zinc-800/50 border border-dashed border-zinc-700 rounded-2xl py-16 text-center">
          <p className="text-sm font-semibold text-zinc-400">Nenhum atendimento agendado</p>
          <p className="text-xs text-zinc-500 mt-1">O dia está livre — use "Novo agendamento" para preencher a agenda.</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700" />

          <div className="flex flex-col gap-4">
            {agendamentos.map((ag) => (
              <div key={ag.id} className="relative">
                <span className="absolute -left-6 top-2 w-3 h-3 rounded-full ring-4 ring-zinc-900 bg-zinc-600" />

                <button className={cx.card} onClick={() => setSelecionadoId(ag.id)}>
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="min-w-[64px]">
                      <span className={cx.horario}>
                        {new Date(ag.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-white text-[15px] truncate">{ag.cliente_nome}</span>
                        <StatusBadge status={ag.status} />
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {ag.servico_nome}
                        {ag.veiculo_modelo ? ` · ${ag.veiculo_modelo}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className="text-base font-bold text-white font-mono tabular-nums shrink-0">
                    R$ {Number(ag.valor).toFixed(2).replace(".", ",")}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AgendamentoModal
        agendamentos={agendamentos}
        agendamentoId={selecionadoId}
        onFechar={() => setSelecionadoId(null)}
      />
    </div>
  );
}