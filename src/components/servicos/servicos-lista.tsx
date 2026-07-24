// components/servicos/servicos-lista.tsx

type Servico = {
  id: string;
  nome: string;
  preco: string;
  duracao_minutos: number;
  ativo: boolean;
};

export function ServicosLista({ servicos }: { servicos: Servico[] }) {
  if (servicos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum serviço cadastrado ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {servicos.map((s) => (
        <div
          key={s.id}
          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium">{s.nome}</p>
            <p className="text-sm text-gray-500">
              R$ {Number(s.preco).toFixed(2).replace(".", ",")} · {s.duracao_minutos} min
            </p>
          </div>
          {!s.ativo && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Inativo
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
