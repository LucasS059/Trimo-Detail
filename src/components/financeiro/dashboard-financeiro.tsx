"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "@/lib/formatters";

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  confirmado: { label: "Confirmado", style: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  pendente: { label: "Pendente", style: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  falhou: { label: "Falhou", style: "bg-red-500/10 border-red-500/20 text-red-400" },
};

export function DashboardFinanceiro({ metricas, grafico, pagamentos, mesAtual, anoAtual }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Otimização: Só recalcula a formatação se os dados do gráfico mudarem
  const dadosGraficoMapeados = useMemo(() => {
    return grafico.map((g: any) => ({
      ...g,
      totalFormatado: formatarMoeda(g.total),
    }));
  }, [grafico]);

  function mudarMes(novoMes: number, novoAno: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", novoMes.toString());
    params.set("ano", novoAno.toString());
    params.set("pagina", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function mudarPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", novaPagina.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Faturamento (Confirmado)</p>
          <p className="text-2xl font-black text-white tabular-nums">{formatarMoeda(metricas.totalConfirmado)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">A Receber</p>
          <p className="text-2xl font-black text-zinc-300 tabular-nums">{formatarMoeda(metricas.totalAReceber)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Ticket Médio</p>
          <p className="text-2xl font-black text-zinc-300 tabular-nums">{formatarMoeda(metricas.ticketMedio)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Serviços Feitos</p>
          <p className="text-2xl font-black text-zinc-300 tabular-nums">{metricas.qtdServicos}</p>
        </div>
      </div>

      {/* Gráfico de Faturamento */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-white mb-6">Faturamento Diário</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoMapeados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dia" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
              <Tooltip 
                cursor={{ fill: '#27272a' }}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#E56B25', fontWeight: 'bold' }}
              />
              <Bar dataKey="total" fill="#E56B25" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}