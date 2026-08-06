"use client";

import { useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cancelarAgendamentoPeloCliente, confirmarPresenca } from "@/lib/actions/agendamentos";
import { formatarMoeda } from "@/lib/formatters";

type ServicoDoAgendamento = { id: string; nome: string; preco: number; duracaoMinutos: number };

type Agendamento = {
  id: string;
  data_hora: string;
  status: string;
  presenca_confirmada: boolean;
  cliente_nome: string;
  servicos: ServicoDoAgendamento[];
  loja_nome: string;
  loja_slug: string;
  valor: string;
  cor_primaria?: string | null;
  fuso_horario?: string | null;
};

export function AcompanhamentoAgendamento({
  agendamento,
  modo = "page",
  onFechar,
}: {
  agendamento: Agendamento;
  modo?: "page" | "modal";
  onFechar?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const podeConfirmarPresenca = agendamento.status === "agendado" && !agendamento.presenca_confirmada;
  const podeCancelar = agendamento.status === "agendado";
  const mostrarAvisoNaoCancelavel = !podeCancelar && agendamento.status !== "cancelado" && agendamento.status !== "concluido";

  function cancelar() {
    if (!confirm("Tem certeza que deseja cancelar seu agendamento?")) return;
    startTransition(async () => {
      const res = await cancelarAgendamentoPeloCliente(agendamento.id);
      if (res && !res.sucesso) {
        alert(res.erro);
      }
    });
  }

  function confirmar() {
    startTransition(async () => {
      const res = await confirmarPresenca(agendamento.id);
      if (res && !res.sucesso) {
        alert(res.erro);
      }
    });
  }

  const conteudo = (
    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">

      <div className="text-center space-y-2 pt-2">
        <p className="text-xs uppercase tracking-widest font-bold text-zinc-500">{agendamento.loja_nome}</p>
        <h1 className="text-xl font-black text-white">Acompanhar Atendimento</h1>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={agendamento.status} />
          {agendamento.presenca_confirmada && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Presença confirmada
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          {agendamento.servicos.map((s) => (
            <p key={s.id} className="font-semibold text-white text-base">{s.nome}</p>
          ))}
        </div>

        <p className="text-sm text-zinc-400 mt-1 capitalize">
          {new Date(agendamento.data_hora).toLocaleString("pt-BR", {
            timeZone: agendamento.fuso_horario || "America/Sao_Paulo",
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        <p className="text-lg font-bold text-white font-mono tabular-nums mt-3">
          {formatarMoeda(agendamento.valor)}
        </p>
      </div>

      {(podeConfirmarPresenca || podeCancelar || mostrarAvisoNaoCancelavel) && (
        <div className="flex flex-col gap-2.5 mt-5">
          {podeConfirmarPresenca && (
            <Button disabled={pending} onClick={confirmar}>
              Confirmar presença
            </Button>
          )}
          {podeCancelar ? (
            <Button variant="danger" disabled={pending} onClick={cancelar}>
              Cancelar agendamento
            </Button>
          ) : mostrarAvisoNaoCancelavel ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Atendimento já iniciado — entre em contato com a loja se precisar cancelar.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  if (modo === "modal") return conteudo;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      {conteudo}
    </div>
  );
}