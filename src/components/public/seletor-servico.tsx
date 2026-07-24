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
      <h2 className="font-medium mb-3">Escolha o serviço</h2>
      <div className="flex flex-col gap-2">
        {servicos.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelecionar(s)}
            className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
          >
            <p className="font-medium">{s.nome}</p>
            <p className="text-sm text-gray-500">
              R$ {Number(s.preco).toFixed(2).replace(".", ",")} · {s.duracao_minutos} min
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
