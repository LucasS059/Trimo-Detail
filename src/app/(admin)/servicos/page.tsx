import { listarServicos } from "@/lib/db/servicos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ServicosLista } from "@/components/servicos/servicos-lista";

export default async function ServicosPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const servicos = await listarServicos(lojaId, false);

  return (
    <div className="max-w-5xl mx-auto w-full">
      <ServicosLista servicos={servicos} />
    </div>
  );
}