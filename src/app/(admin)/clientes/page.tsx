import { listarClientes } from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; page?: string }>;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const params = await searchParams;
  const busca = params.busca || "";
  const pagina = Number(params.page) || 1;

  const resultado = await listarClientes(lojaId, busca, pagina, 10);

  return (
    <div className="min-h-screen bg-zinc-50 -m-6 p-6 sm:-m-8 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <ClientesLista 
          clientes={resultado.dados} 
          paginaAtual={resultado.paginaAtual}
          totalPaginas={resultado.totalPaginas}
          totalClientes={resultado.totalClientes}
          buscaAtual={busca}
        />
      </div>
    </div>
  );
}