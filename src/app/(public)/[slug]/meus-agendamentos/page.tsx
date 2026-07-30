import { buscarLojaPorSlug } from "@/lib/db/lojas";
import { notFound } from "next/navigation";
import { MeusAgendamentos } from "@/components/public/agendamentos/meus-agendamentos";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loja = await buscarLojaPorSlug(slug);

  if (!loja) return { title: "Página não encontrada" };

  return {
    title: `Meus Agendamentos | ${loja.nome}`,
    description: `Acompanhe o status dos seus serviços na ${loja.nome}.`,
  };
}

export default async function PaginaMeusAgendamentos({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loja = await buscarLojaPorSlug(slug);
  
  if (!loja) notFound();

  return <MeusAgendamentos loja={loja} />;
}