// app/(admin)/servicos/page.tsx
import { listarServicos } from "@/lib/db/servicos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ServicosLista } from "@/components/servicos/servicos-lista";

export default async function ServicosPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  // Trazemos todos os serviços (ativos e inativos) para gestão
  const servicos = await listarServicos(lojaId, false);

  return (
    <div className="min-h-screen bg-zinc-50 -m-6 p-6 sm:-m-8 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <ServicosLista servicos={servicos} />
      </div>
    </div>
  );
}