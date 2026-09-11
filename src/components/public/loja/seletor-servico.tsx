// components/public/seletor-servico.tsx
"use client";

import { formatarMoeda } from "@/lib/formatters";

type Servico = {
  id: string;
  nome: string;
  preco: number | string;
  duracao_minutos: number;
};

export function SeletorServico({
  servicos,
  selecionadosIds,
  onAlternar,
}: {
  servicos: Servico[];
  selecionadosIds: string[];
  onAlternar: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">O que você precisa hoje?</h1>
      <p className="text-zinc-400 text-sm mb-8">Selecione um ou mais serviços abaixo.</p>

      {servicos.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-12 px-4 text-center">
          <p className="text-sm text-zinc-500">Nenhum serviço disponível.</p>
        </div>
      ) : (
        // Mudança RADICAL: Layout em Grid (2 colunas) em vez de lista
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map((s) => {
            const selecionado = selecionadosIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => onAlternar(s.id)}
                className={`group relative text-left bg-zinc-900 p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[140px] ${
                  selecionado
                    ? "border-[var(--brand)] bg-zinc-900/80 shadow-sm"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Checkbox no topo direito */}
                <div className="absolute top-5 right-5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selecionado
                        ? "border-[var(--brand)] bg-[var(--brand)]"
                        : "border-zinc-700"
                    }`}
                  >
                    {selecionado && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className={`font-semibold text-base pr-8 mb-1 ${selecionado ? 'text-white' : 'text-zinc-200'}`}>
                    {s.nome}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {s.duracao_minutos} min
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-800/60 w-full">
                  <span className={`font-bold text-lg ${selecionado ? 'text-white' : 'text-zinc-300'}`}>
                    {formatarMoeda(s.preco)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}