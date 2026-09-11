import { redirect } from "next/navigation";
import { subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, isValid, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { getDadosFinanceiros } from "@/lib/db/financeiro";
import { DashboardFinanceiro } from "@/components/financeiro/dashboard-financeiro";
import { pool } from "@/lib/db/client";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; pagina?: string; dataInicio?: string; dataFim?: string }>;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const params = await searchParams;

  const { rows: lojaRows } = await pool.query(
    `SELECT fuso_horario FROM lojas WHERE id = $1`,
    [lojaId]
  );
  const fusoHorario = lojaRows[0]?.fuso_horario || "America/Sao_Paulo";

  const pagina = params.pagina ? parseInt(params.pagina, 10) : 1;
  const periodo = params.periodo;

  let dataInicio: Date;
  let dataFim: Date;
  let periodoAtual: string = periodo ?? "mes_atual";

  const agoraNaLoja = toZonedTime(new Date(), fusoHorario);

  if (params.dataInicio && params.dataFim) {
    const inicio = parseISO(params.dataInicio);
    const fim = parseISO(params.dataFim);
    if (isValid(inicio) && isValid(fim)) {
      dataInicio = fromZonedTime(inicio, fusoHorario);
      dataFim = fromZonedTime(fim, fusoHorario);
      periodoAtual = "custom";
    } else {
      dataInicio = fromZonedTime(startOfMonth(agoraNaLoja), fusoHorario);
      dataFim = fromZonedTime(endOfMonth(agoraNaLoja), fusoHorario);
      periodoAtual = "mes_atual";
    }
  } else {
    switch (periodo) {
      case "hoje":
        periodoAtual = "hoje";
        dataInicio = fromZonedTime(startOfDay(agoraNaLoja), fusoHorario);
        dataFim = fromZonedTime(endOfDay(agoraNaLoja), fusoHorario);
        break;
      case "7d":
        periodoAtual = "7d";
        dataInicio = fromZonedTime(subDays(agoraNaLoja, 6), fusoHorario);
        dataFim = fromZonedTime(agoraNaLoja, fusoHorario);
        break;
      case "mes_atual":
        periodoAtual = "mes_atual";
        dataInicio = fromZonedTime(startOfMonth(agoraNaLoja), fusoHorario);
        dataFim = fromZonedTime(endOfMonth(agoraNaLoja), fusoHorario);
        break;
      default:
        periodoAtual = "30d";
        dataInicio = fromZonedTime(subDays(agoraNaLoja, 29), fusoHorario);
        dataFim = fromZonedTime(agoraNaLoja, fusoHorario);
        break;
    }
  }

  const dados = await getDadosFinanceiros(lojaId, dataInicio, dataFim, pagina, 10);

  // Redireciona se a página atual for maior que o total existente
  if (dados.pagamentos.totalPaginas > 0 && pagina > dados.pagamentos.totalPaginas) {
    const p = new URLSearchParams();
    if (periodo) p.set("periodo", periodo);
    if (params.dataInicio) p.set("dataInicio", params.dataInicio);
    if (params.dataFim) p.set("dataFim", params.dataFim);
    p.set("pagina", String(dados.pagamentos.totalPaginas));
    redirect(`/financeiro?${p.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <DashboardFinanceiro
        dados={dados}
        periodoAtual={periodoAtual}
        paginaAtual={pagina}
        dataInicio={format(dataInicio, "yyyy-MM-dd", { timeZone: fusoHorario })}
        dataFim={format(dataFim, "yyyy-MM-dd", { timeZone: fusoHorario })}
        fusoHorario={fusoHorario}
      />
    </div>
  );
}