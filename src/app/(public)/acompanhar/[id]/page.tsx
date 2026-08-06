import { buscarAgendamento } from "@/lib/db/agendamentos";
import { notFound, redirect } from "next/navigation";

export default async function AcompanharAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendamento = await buscarAgendamento(id);
  if (!agendamento) notFound();

  redirect(`/${agendamento.loja_slug}/meus-agendamentos`);
}