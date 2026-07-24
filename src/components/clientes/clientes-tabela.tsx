// components/clientes/clientes-tabela.tsx

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
};

export function ClientesTabela({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum cliente cadastrado ainda.</p>;
  }

  return (
    <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
      <thead className="bg-gray-50 text-left text-gray-500">
        <tr>
          <th className="px-4 py-3 font-medium">Nome</th>
          <th className="px-4 py-3 font-medium">Telefone</th>
          <th className="px-4 py-3 font-medium">E-mail</th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((c) => (
          <tr key={c.id} className="border-t border-gray-100">
            <td className="px-4 py-3">{c.nome}</td>
            <td className="px-4 py-3">{c.telefone}</td>
            <td className="px-4 py-3">{c.email ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
