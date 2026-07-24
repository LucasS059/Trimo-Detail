import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db/client";
import { ConfiguracoesForm } from "@/components/layout/configuracoes-form";

export default async function ConfiguracoesPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const { rows } = await pool.query(
    `SELECT nome, slug, nome_dono, descricao, imagem_url, endereco,
            antecedencia_minima_minutos, prazo_cancelamento_minutos,
            lembrete_confirmacao_minutos, dias_futuros_visiveis,
            mercadopago_user_id,
            (mercadopago_access_token IS NOT NULL) AS tem_mercadopago_configurado
     FROM lojas WHERE id = $1`,
    [lojaId]
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Configurações da loja</h1>
      <ConfiguracoesForm loja={rows[0]} />
    </div>
  );
}