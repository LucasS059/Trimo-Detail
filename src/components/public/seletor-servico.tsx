// components/public/seletor-servico.tsx

type Servico = {
  id: string;
  nome: string;
  preco: string;
  duracao_minutos: number;
};

export function SeletorServico({
  servicos,
  onSelecionar,
}: {
  servicos: Servico[];
  onSelecionar: (servico: Servico) => void;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Escolha o serviço</h2>

      {servicos.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl py-10 px-4 text-center">
          <p className="text-sm text-zinc-500">Nenhum serviço disponível no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelecionar(s)}
              className="group text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[var(--brand,#E56B25)] transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm sm:text-base truncate">{s.nome}</p>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  {s.duracao_minutos} min
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-white font-mono tabular-nums text-sm sm:text-base">
                  R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                </span>
                <svg
                  className="w-4 h-4 text-zinc-600 group-hover:text-[var(--brand,#E56B25)] transition-colors"
                  fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}