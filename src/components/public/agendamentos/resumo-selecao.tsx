// components/public/agendamentos/resumo-selecao.tsx
import { formatarMoeda } from "@/lib/formatters";

type Servico = { id: string; nome: string; preco: number | string; duracao_minutos: number };

export function ResumoSelecao({
  servicos,
  horario,
  brand,
  onTrocarHorario,
  onTrocarServicos,
}: {
  servicos: Servico[];
  horario: Date;
  brand: string;
  onTrocarHorario: () => void;
  onTrocarServicos: () => void;
}) {
  const total = servicos.reduce((soma, s) => soma + Number(s.preco), 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: `${brand}22` }}
      >
        <svg className="w-6 h-6" style={{ color: brand }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>

      <p className="font-bold text-white text-base">Quase lá!</p>
      <p className="text-sm text-zinc-400 mt-1 leading-relaxed max-w-xs mx-auto">
        Confira o resumo e finalize seus dados na sacola.
      </p>

      <div className="mt-5 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-left">
        <p className="text-sm font-semibold text-white">{servicos.map((s) => s.nome).join(" + ")}</p>
        <p className="text-xs text-zinc-500 mt-0.5 capitalize">
          {horario.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
        </p>
        <p className="text-sm font-bold text-white tabular-nums mt-2">
          {formatarMoeda(total.toFixed(2))}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={onTrocarHorario}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          Trocar horário
        </button>
        <span className="text-zinc-700">·</span>
        <button
          onClick={onTrocarServicos}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          Trocar serviços
        </button>
      </div>
    </div>
  );
}