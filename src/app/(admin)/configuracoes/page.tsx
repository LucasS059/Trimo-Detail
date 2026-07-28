import { obterLojaLogadaId } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db/client";
import { ConfiguracoesForm } from "@/components/layout/configuracoes-form";

export default async function ConfiguracoesPage() {
  const lojaId = await obterLojaLogadaId();
  if (!lojaId) redirect("/login");

  const { rows: lojaRows } = await pool.query(
    `SELECT nome, slug, nome_dono, descricao, imagem_url, endereco,
            antecedencia_minima_minutos, prazo_cancelamento_minutos,
            lembrete_confirmacao_minutos, dias_futuros_visiveis,
            mercadopago_user_id, mercadopago_device_id,
            taxa_debito_percentual, taxa_credito_percentual,
            fuso_horario,
            (mercadopago_access_token IS NOT NULL) AS tem_mercadopago_configurado
     FROM lojas WHERE id = $1`,
    [lojaId]
  );

  // 2. Busca os horários de funcionamento (0 a 6)
  let { rows: horarios } = await pool.query(
    `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
     FROM horarios_funcionamento
     WHERE loja_id = $1
     ORDER BY dia_semana ASC`,
    [lojaId]
  );

  // Se a loja não tem horários cadastrados (primeiro login), cria o padrão
  if (horarios.length === 0) {
    const padrao = [
      { dia: 0, abertura: "08:00", fechamento: "18:00", fechado: true },  // Domingo
      { dia: 1, abertura: "08:00", fechamento: "18:00", fechado: false }, // Segunda
      { dia: 2, abertura: "08:00", fechamento: "18:00", fechado: false }, // Terça
      { dia: 3, abertura: "08:00", fechamento: "18:00", fechado: false }, // Quarta
      { dia: 4, abertura: "08:00", fechamento: "18:00", fechado: false }, // Quinta
      { dia: 5, abertura: "08:00", fechamento: "18:00", fechado: false }, // Sexta
      { dia: 6, abertura: "08:00", fechamento: "14:00", fechado: false }, // Sábado
    ];

    for (const h of padrao) {
      await pool.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [lojaId, h.dia, h.abertura, h.fechamento, h.fechado]
      );
    }

    const reload = await pool.query(
      `SELECT dia_semana, hora_abertura, hora_fechamento, fechado
       FROM horarios_funcionamento WHERE loja_id = $1 ORDER BY dia_semana ASC`,
      [lojaId]
    );
    horarios = reload.rows;
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Configurações da Loja</h1>
        <p className="text-sm font-medium text-zinc-300 mt-0.5">Gerencie as informações públicas, integrações e o expediente da estética</p>
      </div>
      <ConfiguracoesForm loja={lojaRows[0]} horariosIniciais={horarios} />
    </div>
  );
}