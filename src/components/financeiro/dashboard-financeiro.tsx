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
  confirmado: { label: "Confirmado", style: "bg-emerald-100 text-emerald-700" },
  pendente: { label: "Pendente", style: "bg-orange-100 text-orange-700" },
  falhou: { label: "Falhou", style: "bg-red-100 text-red-700" },
};

export function DashboardFinanceiro({
  resumo,
  grafico,
  pagamentos,
  mesAtual,
  anoAtual,
}: {
  resumo: { porForma: { forma: string; total: string }[]; totalEmAberto: string };
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

  const totalRecebido = resumo.porForma.reduce((soma, item) => soma + Number(item.total), 0);
  
  // Descobre qual foi o método que mais gerou dinheiro
  const topForma = [...resumo.porForma].sort((a, b) => Number(b.total) - Number(a.total))[0];

  function mudarMes(delta: number) {
    let novoMes = mesAtual + delta;
    let novoAno = anoAtual;

    if (novoMes > 12) { novoMes = 1; novoAno++; }
    if (novoMes < 1) { novoMes = 12; novoAno--; }

    const params = new URLSearchParams(searchParams);
    params.set("mes", novoMes.toString());
    params.set("ano", novoAno.toString());
    params.delete("page"); // Reseta a página ao mudar de mês
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
      
      {/* 1. Header & Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Dashboard Financeiro</h1>
          <p className="text-sm font-medium text-zinc-500 mt-0.5">Visão geral do faturamento e entradas</p>
        </div>

        <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
          <button onClick={() => mudarMes(-1)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="w-40 text-center text-sm font-bold text-zinc-800 capitalize">{nomeDoMes}</span>
          <button onClick={() => mudarMes(1)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* 2. KPIs (Métricas Principais) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Faturamento Atual</p>
          <p className="text-3xl font-black text-zinc-900 tabular-nums">
            R$ {totalRecebido.toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Pendente a Receber</p>
          <p className="text-3xl font-black text-orange-600 tabular-nums">
            R$ {Number(resumo.totalEmAberto).toFixed(2).replace(".", ",")}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Método Campeão</p>
          {topForma ? (
            <div>
              <p className="text-3xl font-black uppercase">{LABEL_FORMA[topForma.forma] ?? topForma.forma}</p>
              <p className="text-sm font-medium text-zinc-400 mt-1">
                R$ {Number(topForma.total).toFixed(2).replace(".", ",")} processados
              </p>
            </div>
          ) : (
            <p className="text-xl font-bold text-zinc-500">Sem dados</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Gráfico de Faturamento por Dia */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-wider">Faturamento por Dia</h3>
          <div className="h-72 w-full">
            {grafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#F4F4F5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`, "Receita"]}
                  />
                  <Bar dataKey="total" fill="#E56B25" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm font-medium border border-dashed border-zinc-200 rounded-xl">
                Sem dados no período
              </div>
            )}
          </div>
        </div>

        {/* 4. Lista de Entradas (Histórico) */}
        <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col shadow-sm">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Histórico de Entradas</h3>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">{pagamentos.totalRegistros} transações</span>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {pagamentos.dados.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {pagamentos.dados.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-zinc-50 transition-colors flex justify-between items-center">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-bold text-zinc-900 truncate">{p.cliente_nome}</p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{p.servico_nome}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {LABEL_FORMA[p.forma] ?? p.forma}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${STATUS_BADGE[p.status]?.style || "bg-zinc-100 text-zinc-600"}`}>
                          {STATUS_BADGE[p.status]?.label || p.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-zinc-900 tabular-nums">
                        R$ {Number(p.valor).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-400 text-sm font-medium">
                Nenhuma entrada registrada.
              </div>
            )}
          </div>

          {/* Paginação do Histórico */}
          {pagamentos.totalPaginas > 1 && (
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between rounded-b-2xl">
              <button 
                onClick={() => mudarPagina(pagamentos.paginaAtual - 1)}
                disabled={pagamentos.paginaAtual === 1}
                className="text-xs font-bold text-zinc-600 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                ← Voltar
              </button>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Pág {pagamentos.paginaAtual} de {pagamentos.totalPaginas}
              </span>
              <button 
                onClick={() => mudarPagina(pagamentos.paginaAtual + 1)}
                disabled={pagamentos.paginaAtual === pagamentos.totalPaginas}
                className="text-xs font-bold text-zinc-600 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                Avançar →
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}