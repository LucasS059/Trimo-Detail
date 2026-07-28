"use client";
// components/public/acompanhamento-agendamento.tsx

import { useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cancelarAgendamentoPeloCliente, confirmarPresenca } from "@/lib/actions/agendamentos";

type Agendamento = {
  id: string;
  data_hora: string;
  status: string;
  presenca_confirmada: boolean;
  cliente_nome: string;
  servico_nome: string;
  loja_nome: string;
  valor: string;
  cor_primaria?: string | null;
};

export function AcompanhamentoAgendamento({ agendamento }: { agendamento: Agendamento }) {
  const [pending, startTransition] = useTransition();

  const podeAgir = agendamento.status !== "cancelado" && agendamento.status !== "concluido";

  function cancelar() {
    if (!confirm("Tem certeza que deseja cancelar seu agendamento?")) return;
    startTransition(() => cancelarAgendamentoPeloCliente(agendamento.id));
  }

  function confirmar() {
    startTransition(() => confirmarPresenca(agendamento.id));
  }

  return (
    <div
      className="min-h-screen bg-zinc-950"
      style={{ ["--brand" as any]: agendamento.cor_primaria || "#E56B25" }}
    >
      <div className="max-w-md mx-auto py-10 px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{agendamento.loja_nome}</p>
        <h1 className="text-xl font-black text-white mb-5">Seu agendamento</h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <StatusBadge status={agendamento.status} />
            {agendamento.presenca_confirmada && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Presença confirmada
              </span>
            )}
          </div>

          <p className="font-semibold text-white text-base">{agendamento.servico_nome}</p>
          <p className="text-sm text-zinc-400 mt-1 capitalize">
            {new Date(agendamento.data_hora).toLocaleString("pt-BR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
          <p className="text-lg font-bold text-white font-mono tabular-nums mt-3">
            R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
          </p>
        </div>

        {podeAgir && (
          <div className="flex flex-col gap-2.5 mt-5">
            {!agendamento.presenca_confirmada && (
              <Button disabled={pending} onClick={confirmar}>
                Confirmar presença
              </Button>
            )}
            <Button variant="danger" disabled={pending} onClick={cancelar}>
              Cancelar agendamento
            </Button>
          </div>
        )}

        <p className="text-center text-[11px] text-zinc-600 mt-10">
          Agendamento online via Trimo Detail
        </p>
      </div>
    </div>
  );
}