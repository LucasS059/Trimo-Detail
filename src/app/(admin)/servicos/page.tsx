// app/(admin)/servicos/page.tsx
import { listarServicos } from "@/lib/db/servicos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ServicosLista } from "@/components/servicos/servicos-lista";
import { ServicoForm } from "@/components/servicos/servico-form";

export default async function ServicosPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const servicos = await listarServicos(lojaId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Serviços</h1>
      <ServicoForm />
      <div className="mt-6">
        <ServicosLista servicos={servicos} />
      </div>
    </div>
  );
}
