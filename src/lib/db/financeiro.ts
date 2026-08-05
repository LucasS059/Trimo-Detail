import { metricasFinanceiras, faturamentoPorDia, listarPagamentosPaginados } from "./pagamentos";

export async function getDadosFinanceiros(
  lojaId: string, 
  dataInicio: Date, 
  dataFim: Date, 
  pagina: number = 1, 
  limite: number = 8
) {
  const [metricas, grafico, pagamentos] = await Promise.all([
    metricasFinanceiras(lojaId, dataInicio, dataFim),
    faturamentoPorDia(lojaId, dataInicio, dataFim),
    listarPagamentosPaginados(lojaId, dataInicio, dataFim, pagina, limite) 
  ]);

  return {
    metricas,
    grafico,
    pagamentos,
  }
}
