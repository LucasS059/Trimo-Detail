import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ConfiguracoesForm } from "@/components/configuracoes";
import { buscarConfiguracoesLoja, obterOuCriarHorariosFuncionamento } from "@/lib/db/lojas";

export default async function ConfiguracoesPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  // Isolamento completo do SQL através das funções da camada de dados
  const [loja, horarios] = await Promise.all([
    buscarConfiguracoesLoja(lojaId),
    obterOuCriarHorariosFuncionamento(lojaId),
  ]);

  if (!loja) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Configurações da Loja</h1>
        <p className="text-sm font-medium text-zinc-300 mt-0.5">
          Gerencie as informações públicas, integrações e o expediente da estética
        </p>
      </div>
      
      <ConfiguracoesForm loja={loja} horariosIniciais={horarios} />
    </div>
  );
}