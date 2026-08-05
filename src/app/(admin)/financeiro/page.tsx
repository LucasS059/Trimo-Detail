import { redirect } from "next/navigation";
import { subDays, startOfMonth, endOfMonth, isValid, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { getDadosFinanceiros } from "@/lib/db/financeiro";
import { DashboardFinanceiro } from "@/components/financeiro/dashboard-financeiro";
import { pool } from "@/lib/db/client";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { periodo?: string; pagina?: string; dataInicio?: string; dataFim?: string };
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const { rows: lojaRows } = await pool.query(
    `SELECT fuso_horario FROM lojas WHERE id = $1`,
    [lojaId]
  );
  const fusoHorario = lojaRows[0]?.fuso_horario || "America/Sao_Paulo";

  const pagina = searchParams.pagina ? parseInt(searchParams.pagina) : 1;
  const periodo = searchParams.periodo;

  let dataInicio: Date;
  let dataFim: Date;
  let periodoAtual: string = periodo ?? "30d";

  const agoraNaLoja = toZonedTime(new Date(), fusoHorario);

  if (searchParams.dataInicio && searchParams.dataFim) {
    const inicio = parseISO(searchParams.dataInicio);
    const fim = parseISO(searchParams.dataFim);
    if (isValid(inicio) && isValid(fim)) {
      dataInicio = fromZonedTime(inicio, fusoHorario);
      dataFim = fromZonedTime(fim, fusoHorario);
      periodoAtual = "custom";
    } else {
      dataInicio = fromZonedTime(subDays(agoraNaLoja, 29), fusoHorario);
      dataFim = fromZonedTime(agoraNaLoja, fusoHorario);
      periodoAtual = "30d";
    }
  } else {
    switch (periodo) {
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