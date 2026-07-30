// app/(public)/[slug]/page.tsx
import { buscarLojaPorSlug } from "@/lib/db/lojas";
import { listarServicos } from "@/lib/db/servicos";
import { notFound } from "next/navigation";
import { LojaPublica } from "@/components/public/loja/loja-publica";

export default async function PaginaPublicaLoja({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loja = await buscarLojaPorSlug(slug);
  if (!loja) notFound();

  const servicos = await listarServicos(loja.id, true);

  return <LojaPublica loja={loja} servicos={servicos} />;
}