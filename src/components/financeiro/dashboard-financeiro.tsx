"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const LABEL_FORMA: Record<string, string> = {
  pix: "Pix",
  point: "Maquininha",
  manual: "Manual",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
};

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  confirmado: { label: "Confirmado", style: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" },
  pendente: { label: "Pendente", style: "bg-orange-500/10 border border-orange-500/20 text-orange-400" },
  falhou: { label: "Falhou", style: "bg-red-500/10 border border-red-500/20 text-red-400" },
};

export function DashboardFinanceiro({
  metricas,
  grafico,
  pagamentos,
  mesAtual,
  anoAtual,
}: {
  metricas: { 
    totalConfirmado: number; 
    ticketMedio: number; 
    qtdServicos: number; 
    totalAReceber: number; 
    topServicos: { nome: string; total: number; qtd: number }[] 
  };
  grafico: { dia: string; total: number }[];
  pagamentos: {
    dados: any[];
    totalPaginas: number;
    paginaAtual: number;
    totalRegistros: number;
  };
  mesAtual: number;
  anoAtual: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function mudarMes(delta: number) {
    let novoMes = mesAtual + delta;
    let novoAno = anoAtual;

    if (novoMes > 12) { novoMes = 1; novoAno++; }
    if (novoMes < 1) { novoMes = 12; novoAno--; }

    const params = new URLSearchParams(searchParams);
    params.set("mes", novoMes.toString());
    params.set("ano", novoAno.toString());
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function mudarPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", novaPagina.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const nomeDoMes = new Date(anoAtual, mesAtual - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      
      {/* Header & Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Dashboard Financeiro</h1>
          <p className="text-sm font-medium text-zinc-400 mt-0.5">Indicadores de desempenho e fluxo de caixa</p>
        </div>

        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-sm">
          <button onClick={() => mudarMes(-1)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="w-40 text-center text-sm font-bold text-white capitalize">{nomeDoMes}</span>
          <button onClick={() => mudarMes(1)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* KPIs Estratégicos (A linguagem do dono) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Faturamento Confirmado</p>
          <p className="text-3xl font-black text-white tabular-nums">
            R$ {metricas.totalConfirmado.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-zinc-400 mt-2 font-medium">De {metricas.qtdServicos} serviços finalizados</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Ticket Médio</p>
          <p className="text-3xl font-black text-white tabular-nums">
            R$ {metricas.ticketMedio.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-zinc-400 mt-2 font-medium">Gasto médio por cliente</p>
        </div>

        <div className="bg-zinc-900 border border-[#E56B25]/30 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E56B25] mb-2">Previsão de Caixa (A Receber)</p>
          <p className="text-3xl font-black text-orange-500 tabular-nums">
            R$ {metricas.totalAReceber.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-xs text-zinc-400 mt-2 font-medium">Agendados e aguardando pagamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Faturamento por Dia */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Receita Diária</h3>
          <div className="h-72 w-full">
            {grafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A1A1AA' }} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#27272A' }}
                    contentStyle={{ backgroundColor: '#18181B', borderRadius: '12px', border: '1px solid #3F3F46', color: '#fff' }}
                    itemStyle={{ color: '#E56B25', fontWeight: 'bold' }}
                    formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`, "Faturado"]}
                  />
                  <Bar dataKey="total" fill="#E56B25" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm font-medium border border-dashed border-zinc-700 rounded-xl">
                Sem receita confirmada neste período.
              </div>
            )}
          </div>
        </div>

        {/* Top Serviços */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Serviços do Mês</h3>
            <p className="text-xs text-zinc-500 mt-1">Serviços que mais geraram receita</p>
          </div>
          
          <div className="flex-1 p-5">
            {metricas.topServicos.length > 0 ? (
              <div className="space-y-4">
                {metricas.topServicos.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-bold text-white truncate">{s.nome}</p>
                      <p className="text-[11px] text-zinc-500 font-medium uppercase mt-0.5">{s.qtd} realizados</p>
                    </div>
                    <p className="text-sm font-black text-[#E56B25] tabular-nums shrink-0">
                      R$ {s.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm font-medium text-center">
                Sem dados suficientes para o ranking.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Entradas (Histórico) - Colocado em linha cheia para dar espaço à tabela */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Movimentações</h3>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md">{pagamentos.totalRegistros} transações</span>
        </div>
        
        <div className="overflow-x-auto">
          {pagamentos.dados.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/30">
                  <th className="px-6 py-4 font-semibold">Cliente / Serviço</th>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Método</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pagamentos.dados.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{p.cliente_nome}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{p.servico_nome}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-300 tabular-nums">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded">
                          {LABEL_FORMA[p.forma] ?? p.forma}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${STATUS_BADGE[p.status]?.style || "bg-zinc-800 text-zinc-500"}`}>
                          {STATUS_BADGE[p.status]?.label || p.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-white tabular-nums">
                        R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-zinc-500 text-sm font-medium">
              Nenhuma entrada registrada.
            </div>
          )}
        </div>

        {/* Paginação do Histórico */}
        {pagamentos.totalPaginas > 1 && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <button 
              onClick={() => mudarPagina(pagamentos.paginaAtual - 1)}
              disabled={pagamentos.paginaAtual === 1}
              className="text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
            >
              Anterior
            </button>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Página {pagamentos.paginaAtual} de {pagamentos.totalPaginas}
            </span>
            <button 
              onClick={() => mudarPagina(pagamentos.paginaAtual + 1)}
              disabled={pagamentos.paginaAtual === pagamentos.totalPaginas}
              className="text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

    </div>
  );
}