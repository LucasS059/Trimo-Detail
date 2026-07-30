import { listarClientes } from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina?: string }>;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  // Lê os parâmetros da URL de forma assíncrona (Padrão Next.js 15)
  const params = await searchParams;
  const busca = params.busca || "";
  const paginaAtual = params.pagina ? parseInt(params.pagina, 10) : 1;

  // Chamada limpa à nossa camada de banco de dados
  const resultado = await listarClientes(lojaId, busca, paginaAtual, 10);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Cabeçalho Padronizado */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Meus Clientes</h1>
        <p className="text-sm font-medium text-zinc-300 mt-0.5">
          Gerencie o histórico, contatos e os veículos da sua clientela
        </p>
      </div>

      {/* Lista passando as nomenclaturas perfeitamente alinhadas com o Backend */}
      <ClientesLista 
        clientes={resultado.clientes as any} 
        paginaAtual={paginaAtual}
        totalPaginas={resultado.totalPaginas}
        totalClientes={resultado.total}
        buscaAtual={busca}
      />
    </div>
  );
}