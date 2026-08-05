"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "@/lib/formatters";

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    confirmado: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    pendente: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    falhou: "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  const label: Record<string, string> = {
    confirmado: "Confirmado",
    pendente: "Pendente",
    falhou: "Falhou",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.pendente}`}>
      {label[status] || "Pendente"}
    </span>
  );
};

const PRESETS = [
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Este mês", value: "mes_atual" },
];

const PeriodoFiltro = ({ periodoAtual, dataInicio, dataFim }: { periodoAtual: string, dataInicio: string, dataFim: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inicio, setInicio] = useState(dataInicio);
  const [fim, setFim] = useState(dataFim);
  const [mostrarCustom, setMostrarCustom] = useState(periodoAtual === "custom");

  const selecionado = mostrarCustom ? "custom" : periodoAtual;

  const rotuloAtual =
    PRESETS.find((p) => p.value === periodoAtual)?.label ??
    (periodoAtual === "custom" ? `${dataInicio} até ${dataFim}` : "Selecionar período");

  function mudarPeriodoPreset(periodo: string) {
    setMostrarCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", periodo);
    params.set("pagina", "1");
    params.delete("dataInicio");
    params.delete("dataFim");
    router.push(`${pathname}?${params.toString()}`);
  }

  function mudarPeriodoCustom() {
    if (!inicio || !fim) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("dataInicio", inicio);
    params.set("dataFim", fim);
    params.set("pagina", "1");
    params.delete("periodo");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value;
    if (valor === "custom") {
      setMostrarCustom(true);
    } else {
      mudarPeriodoPreset(valor);
    }
  }

  const inputStyle = "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none";

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        value={selecionado}
        onChange={handleSelect}
        className={`${inputStyle} font-semibold cursor-pointer`}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
        <option value="custom">Período personalizado</option>
      </select>

      {mostrarCustom && (
        <div className="flex items-center gap-2">
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className={inputStyle} />
          <span className="text-zinc-500">até</span>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} className={inputStyle} />
          <button
            onClick={mudarPeriodoCustom}
            className="px-3 py-1.5 text-sm font-semibold rounded-full transition-colors bg-amber-600 text-white hover:bg-amber-500 disabled:bg-zinc-600"
            disabled={!inicio || !fim}
          >
            Buscar
          </button>
        </div>
      )}
    </div>
  );
};

interface DashboardFinanceiroProps {
  dados: {
    metricas: any;
    grafico: any[];
    pagamentos: {
      pagamentos: any[];
      totalPaginas: number;
      paginaAtual: number;
    };
  };
  periodoAtual: string;
  paginaAtual: number;
  dataInicio: string;
  dataFim: string;
  fusoHorario: string;
}

export function DashboardFinanceiro({
  dados,
  periodoAtual,
  paginaAtual,
  dataInicio,
  dataFim,
  fusoHorario,
}: DashboardFinanceiroProps) {
  const { metricas, grafico, pagamentos } = dados;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dadosGraficoMapeados = useMemo(() => {
    return grafico.map((g: any) => ({ ...g, total: Number(g.total) }));
  }, [grafico]);

  const formatadorData = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: fusoHorario,
  }), [fusoHorario]);

  function mudarPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", novaPagina.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Visão Geral Financeira</h1>
        <PeriodoFiltro periodoAtual={periodoAtual} dataInicio={dataInicio} dataFim={dataFim} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Faturamento Confirmado</p>
          <p className="text-3xl font-black text-white tabular-nums">{formatarMoeda(metricas.totalConfirmado)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Agendamentos Finalizados</p>
          <p className="text-3xl font-black text-white tabular-nums">{metricas.qtdServicos}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">Ticket Médio</p>
          <p className="text-3xl font-black text-white tabular-nums">{formatarMoeda(metricas.ticketMedio)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <p className="text-sm font-semibold text-zinc-400 mb-1">A Receber (Pendentes)</p>
          <p className="text-3xl font-black text-zinc-400 tabular-nums">{formatarMoeda(metricas.totalAReceber)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-white mb-6">Faturamento por Dia</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoMapeados} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="dia" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => formatarMoeda(val as number)} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#fafafa', fontWeight: 'bold' }}
                  itemStyle={{ color: '#E56B25', fontWeight: 'bold' }}
                  formatter={(value) => formatarMoeda(value as number)}
                />
                <Bar dataKey="total" fill="#E56B25" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-white mb-6">Top Serviços</h3>
          <div className="space-y-4">
            {metricas.topServicos.length > 0 ? metricas.topServicos.map((s: any, index: number) => (
              <div key={s.nome} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-500 w-4">{index + 1}.</span>
                  <div>
                    <p className="font-semibold text-zinc-200">{s.nome}</p>
                    <p className="text-xs text-zinc-400">{s.qtd} {s.qtd > 1 ? 'vendas' : 'venda'}</p>
                  </div>
                </div>
                <p className="text-base font-bold text-white tabular-nums">{formatarMoeda(s.total)}</p>
              </div>
            )) : <p className="text-sm text-zinc-500 text-center pt-8">Nenhum serviço vendido no período.</p>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Histórico de Transações</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Método</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {pagamentos.pagamentos.length > 0 ? pagamentos.pagamentos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200">{p.cliente_nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{formatadorData.format(new Date(p.confirmado_em || p.data_hora))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">{p.forma}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-white tabular-nums">{formatarMoeda(p.valor)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-zinc-500">Nenhuma transação encontrada no período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {pagamentos.totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Página {pagamentos.paginaAtual} de {pagamentos.totalPaginas}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => mudarPagina(paginaAtual - 1)}
                disabled={paginaAtual <= 1}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => mudarPagina(paginaAtual + 1)}
                disabled={paginaAtual >= pagamentos.totalPaginas}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}