"use client";
// components/public/seletor-horario.tsx

import { useEffect, useState } from "react";
import { buscarHorariosLivresAction } from "@/lib/actions/slots";

type Servico = { id: string; nome: string; duracao_minutos: number };

export function SeletorHorario({
  lojaId,
  servicos,
  onSelecionar,
  onVoltar,
}: {
  lojaId: string;
  servicos: Servico[];
  onSelecionar: (horario: Date) => void;
  onVoltar: () => void;
}) {
  const [dia, setDia] = useState(() => new Date());
  const [horarios, setHorarios] = useState<Date[]>([]);
  const [carregando, setCarregando] = useState(true);

  const duracaoTotal = servicos.reduce((soma, s) => soma + s.duracao_minutos, 0);

  useEffect(() => {
    setCarregando(true);
    buscarHorariosLivresAction({
      lojaId,
      dataISO: dia.toISOString(),
      duracaoServicoMinutos: duracaoTotal,
    }).then((resultado) => {
      setHorarios(resultado.map((h) => new Date(h)));
      setCarregando(false);
    });
  }, [dia, lojaId, duracaoTotal]);

  return (
    <div>
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Trocar serviços
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-5">
        <p className="text-sm font-semibold text-white">{servicos.map((s) => s.nome).join(" + ")}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{duracaoTotal} min de duração</p>
      </div>

      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Escolha o horário</h2>

      <div className="flex items-center justify-between gap-2 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          onClick={() => setDia((d) => new Date(d.getTime() - 86400000))}
          title="Dia anterior"
        >
          ‹
        </button>
        <span className="text-xs sm:text-sm font-semibold text-white capitalize text-center truncate px-1">
          {dia.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </span>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          onClick={() => setDia((d) => new Date(d.getTime() + 86400000))}
          title="Próximo dia"
        >
          ›
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-zinc-500 text-center py-8">Carregando horários...</p>
      ) : horarios.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl py-10 px-4 text-center">
          <p className="text-sm text-zinc-500">Nenhum horário livre nesse dia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {horarios.map((h) => (
            <button
              key={h.toISOString()}
              onClick={() => onSelecionar(h)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-sm font-semibold text-white font-mono tabular-nums hover:border-[var(--brand,#E56B25)] hover:text-[var(--brand,#E56B25)] transition-colors"
            >
              {h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}