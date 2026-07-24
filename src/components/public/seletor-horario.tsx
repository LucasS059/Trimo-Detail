"use client";
// components/public/seletor-horario.tsx

import { useEffect, useState } from "react";
import { buscarHorariosLivresAction } from "@/lib/actions/slots";

type Servico = { id: string; nome: string; duracao_minutos: number };

export function SeletorHorario({
  lojaId,
  servico,
  onSelecionar,
  onVoltar,
}: {
  lojaId: string;
  servico: Servico;
  onSelecionar: (horario: Date) => void;
  onVoltar: () => void;
}) {
  const [dia, setDia] = useState(() => new Date());
  const [horarios, setHorarios] = useState<Date[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    buscarHorariosLivresAction({
      lojaId,
      dataISO: dia.toISOString(),
      duracaoServicoMinutos: servico.duracao_minutos,
    }).then((resultado) => {
      setHorarios(resultado.map((h) => new Date(h)));
      setCarregando(false);
    });
  }, [dia, lojaId, servico.duracao_minutos]);

  return (
    <div>
      <button onClick={onVoltar} className="text-sm text-gray-500 mb-3">
        ← Trocar serviço
      </button>
      <h2 className="font-medium mb-3">Escolha o horário — {servico.nome}</h2>

      <div className="flex items-center gap-3 mb-4">
        <button
          className="px-3 py-1.5 border rounded-lg text-sm"
          onClick={() => setDia((d) => new Date(d.getTime() - 86400000))}
        >
          ← Dia anterior
        </button>
        <span className="text-sm font-medium">
          {dia.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </span>
        <button
          className="px-3 py-1.5 border rounded-lg text-sm"
          onClick={() => setDia((d) => new Date(d.getTime() + 86400000))}
        >
          Próximo dia →
        </button>
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando horários...</p>
      ) : horarios.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum horário livre nesse dia.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {horarios.map((h) => (
            <button
              key={h.toISOString()}
              onClick={() => onSelecionar(h)}
              className="border border-gray-200 rounded-lg py-2 text-sm hover:border-gray-400"
            >
              {h.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
