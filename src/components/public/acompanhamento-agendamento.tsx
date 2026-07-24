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
    <div className="max-w-md mx-auto py-10 px-4">
      <p className="text-sm text-gray-500 mb-1">{agendamento.loja_nome}</p>
      <h1 className="text-xl font-semibold mb-4">Seu agendamento</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={agendamento.status} />
          {agendamento.presenca_confirmada && (
            <span className="text-xs text-green-600">Presença confirmada</span>
          )}
        </div>

        <p className="font-medium">{agendamento.servico_nome}</p>
        <p className="text-sm text-gray-600">
          {new Date(agendamento.data_hora).toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
        </p>
      </div>

      {podeAgir && (
        <div className="flex flex-col gap-2 mt-4">
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
    </div>
  );
}
