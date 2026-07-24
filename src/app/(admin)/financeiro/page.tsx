// app/(admin)/financeiro/page.tsx
import { resumoFinanceiro } from "@/lib/db/pagamentos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ResumoFinanceiro } from "@/components/financeiro/resumo-financeiro";

export default async function FinanceiroPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date();
  fimMes.setHours(23, 59, 59, 999);

  const resumo = await resumoFinanceiro(lojaId, inicioMes, fimMes);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Financeiro</h1>
      <ResumoFinanceiro resumo={resumo} />
    </div>
  );
}
