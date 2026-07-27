import { metricasFinanceiras, faturamentoPorDia, listarPagamentosPaginados } from "@/lib/db/pagamentos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { DashboardFinanceiro } from "@/components/financeiro/dashboard-financeiro";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string; page?: string }>;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const params = await searchParams;
  
  const dataAtual = new Date();
  const mesAtual = params.mes ? parseInt(params.mes) : dataAtual.getMonth() + 1;
  const anoAtual = params.ano ? parseInt(params.ano) : dataAtual.getFullYear();
  const pagina = params.page ? parseInt(params.page) : 1;

  const inicioMes = new Date(anoAtual, mesAtual - 1, 1, 0, 0, 0, 0);
  const fimMes = new Date(anoAtual, mesAtual, 0, 23, 59, 59, 999);

  // Busca as métricas de negócio focadas em estética automotiva
  const [metricas, graficoDiario, pagamentos] = await Promise.all([
    metricasFinanceiras(lojaId, inicioMes, fimMes),
    faturamentoPorDia(lojaId, inicioMes, fimMes),
    listarPagamentosPaginados(lojaId, inicioMes, fimMes, pagina, 8) 
  ]);

  return (
    <div className="max-w-6xl mx-auto w-full">
      <DashboardFinanceiro 
        metricas={metricas} 
        grafico={graficoDiario}
        pagamentos={pagamentos}
        mesAtual={mesAtual} 
        anoAtual={anoAtual} 
      />
    </div>
  );
}