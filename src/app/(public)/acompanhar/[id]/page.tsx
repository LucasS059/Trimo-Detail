// app/(public)/acompanhar/[id]/page.tsx
import { buscarAgendamento } from "@/lib/db/agendamentos";
import { notFound } from "next/navigation";
import { AcompanhamentoAgendamento } from "@/components/public/acompanhamento-agendamento";

export default async function AcompanharAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendamento = await buscarAgendamento(id);
  if (!agendamento) notFound();

  return <AcompanhamentoAgendamento agendamento={agendamento} />;
}
