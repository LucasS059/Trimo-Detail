"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { mudarStatusAgendamento, cancelarAgendamentoPeloDono } from "@/lib/actions/agendamentos";
import type { StatusAgendamento } from "@/lib/db/agendamentos";
import { toast } from "sonner";

type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

export function AgendamentoAcoes({
  agendamentoId,
  status,
  pixExistente,
}: {
  agendamentoId: string;
  status: string;
  pixExistente?: DadosPix | null;
}) {
  const [pending, startTransition] = useTransition();
  const [statusOtimista, setStatusOtimista] = useState(status);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  function atualizarStatus(novoStatus: StatusAgendamento, mensagemSucesso: string) {
    const statusAnterior = statusOtimista;
    setStatusOtimista(novoStatus);

    startTransition(async () => {
      const res = await mudarStatusAgendamento(agendamentoId, novoStatus);
      if (!res.sucesso) {
        setStatusOtimista(statusAnterior); // Rollback
        toast.error(res.erro);
      } else {
        toast.success(mensagemSucesso);
      }
    });
  }

  function iniciarAtendimento() {
    atualizarStatus("em_andamento", "Atendimento iniciado!");
  }

  function marcarProntoParaPagamento() {
    atualizarStatus("aguardando_pagamento", "Aguardando pagamento do cliente!");
  }

  function confirmarCancelamento() {
    startTransition(async () => {
      const res = await cancelarAgendamentoPeloDono(agendamentoId);
      if (res.sucesso) {
        toast.success("Agendamento cancelado.");
        setConfirmandoCancelamento(false);
      } else {
        toast.error(res.erro);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-700">
        {statusOtimista === "agendado" && (
          <Button size="sm" disabled={pending} onClick={iniciarAtendimento}>
            Iniciar atendimento
          </Button>
        )}
        
        {statusOtimista === "em_andamento" && (
          <Button size="sm" disabled={pending} onClick={marcarProntoParaPagamento}>
            Finalizar e Cobrar
          </Button>
        )}

        {statusOtimista !== "cancelado" && statusOtimista !== "concluido" && (
          <Button 
            variant="danger" 
            size="sm" 
            disabled={pending} 
            onClick={() => setConfirmandoCancelamento(true)}
          >
            Cancelar
          </Button>
        )}
      </div>

      <ConfirmModal
        aberto={confirmandoCancelamento}
        titulo="Cancelar Agendamento"
        mensagem="Tem a certeza de que deseja cancelar este agendamento? Esta ação não pode ser desfeita e o horário voltará a ficar disponível."
        textoConfirmar="Sim, cancelar"
        destrutivo
        pending={pending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmandoCancelamento(false)}
      />
    </div>
  );
}