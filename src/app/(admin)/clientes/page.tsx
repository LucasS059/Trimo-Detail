// app/(admin)/clientes/page.tsx
import { listarClientes } from "@/lib/db/clientes";
import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { ClientesTabela } from "@/components/clientes/clientes-tabela";

export default async function ClientesPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const clientes = await listarClientes(lojaId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Clientes</h1>
      <ClientesTabela clientes={clientes} />
    </div>
  );
}
