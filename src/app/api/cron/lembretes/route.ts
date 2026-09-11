import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/client";
import { enviarWhatsApp, mensagemLembretePresenca } from "@/lib/whatsapp/client";

export async function GET(request: NextRequest) {
  // Verificação opcional de segurança com segredo de cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  try {
    // Busca agendamentos ativos para as próximas horas onde a presença ainda não foi confirmada
    const { rows: agendamentosParaLembrar } = await pool.query(
      `SELECT a.id, a.codigo, a.data_hora, 
              c.nome as cliente_nome, c.telefone as cliente_telefone,
              l.nome as loja_nome, l.slug as loja_slug,
              COALESCE(cfg.lembrete_confirmacao_minutos, 60) as lembrete_minutos
       FROM agendamentos a
       JOIN clientes c ON c.id = a.cliente_id
       JOIN lojas l ON l.id = a.loja_id
       LEFT JOIN loja_configuracoes_agenda cfg ON cfg.loja_id = l.id
       WHERE a.status = 'agendado'
         AND a.presenca_confirmada = FALSE
         AND a.data_hora >= now()
         AND a.data_hora <= now() + (COALESCE(cfg.lembrete_confirmacao_minutos, 60) || ' minute')::interval
       ORDER BY a.data_hora ASC
       LIMIT 50`
    );

    let disparados = 0;
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    for (const ag of agendamentosParaLembrar) {
      if (!ag.cliente_telefone) continue;

      const linkConfirmacao = `${appUrl}/acompanhar/${ag.id}`;
      try {
        await enviarWhatsApp({
          telefone: ag.cliente_telefone,
          mensagem: mensagemLembretePresenca({
            nomeCliente: ag.cliente_nome,
            dataHora: new Date(ag.data_hora),
            linkConfirmacao,
          }),
        });
        disparados++;
      } catch (e) {
        console.error(`[cron/lembretes] Falha ao enviar lembrete agendamento #${ag.codigo}:`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      encontrados: agendamentosParaLembrar.length,
      disparados,
    });
  } catch (error: any) {
    console.error("[cron/lembretes] Erro ao processar lembretes:", error);
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }
}

