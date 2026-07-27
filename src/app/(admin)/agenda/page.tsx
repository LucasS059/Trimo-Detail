import { listarAgendamentosPorPeriodo, listarBloqueiosAtivos } from "@/lib/db/agendamentos";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { AgendaLista } from "@/components/agenda/agenda-lista";
import { ModalNovoAgendamento } from "@/components/agenda/modal-novo-agendamento";
import { ModalBloquearHorario } from "@/components/agenda/modal-bloquear-horario";
import { pool } from "@/lib/db/client";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const { data } = await searchParams;

  let inicioDia: Date;
  let fimDia: Date;
  let dataISOString: string;

  if (data) {
    const [year, month, day] = data.split("-").map(Number);
    inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
    fimDia = new Date(year, month - 1, day, 23, 59, 59, 999);
    dataISOString = data;
  } else {
    const hoje = new Date();
    inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    dataISOString = hoje.toLocaleDateString("en-CA");
  }

  const agendamentos = await listarAgendamentosPorPeriodo(lojaId, inicioDia, fimDia);

  const { rows: servicos } = await pool.query(
    `SELECT id, nome FROM servicos WHERE loja_id = $1 AND ativo = TRUE ORDER BY nome`,
    [lojaId]
  );

  const bloqueios = await listarBloqueiosAtivos(lojaId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Agenda</h1>
          <p className="text-sm font-medium text-zinc-400 mt-1">
            Acompanhe os atendimentos do dia e da semana
          </p>
        </div>

        <div className="flex items-center gap-3">
=          <ModalBloquearHorario bloqueios={bloqueios} />
          
          <ModalNovoAgendamento servicos={servicos} />
        </div>
      </div>

      <AgendaLista agendamentos={agendamentos} dataAtual={dataISOString} />
    </div>
  );
}