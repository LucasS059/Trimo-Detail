"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";

import {
  mudarStatusAgendamento,
  cancelarAgendamentoPeloDono,
  finalizarComBaixaManual,
  finalizarComPix,
  finalizarComPoint,
} from "@/lib/actions/agendamentos";
import { toast } from "sonner";

export type ServicoDoAgendamento = { id: string; nome: string; preco: number | string; duracaoMinutos: number };

export type AgendamentoDetalhe = {
  id: string;
  codigo: number;
  data_hora: string;
  duracao_minutos: number;
  valor: number | string;
  status: string;
  presenca_confirmada: boolean;
  cliente_nome: string;
  cliente_telefone: string;
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  servicos: ServicoDoAgendamento[];
};

type Etapa = "detalhe" | "pagamento" | "pix";

type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

export function AgendamentoModal({
  agendamentos,
  agendamentoId,
  onFechar,
}: {
  agendamentos: AgendamentoDetalhe[];
  agendamentoId: string | null;
  onFechar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("detalhe");
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  
  const [detalhePagamentoManual, setDetalhePagamentoManual] = useState("dinheiro");
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);

  const agendamento = agendamentos.find((a) => a.id === agendamentoId);

  useEffect(() => {
    if (agendamentoId) {
      setEtapa("detalhe");
      setDadosPix(null);
    }
  }, [agendamentoId]);

  if (!agendamento) return null;

  // Funções com checagem de segurança (agendamento?.id) para satisfazer o TypeScript 100%
  function iniciarAtendimento() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await mudarStatusAgendamento(agendamento.id, "em_andamento");
      if (!res.sucesso) toast.error(res.erro);
      else toast.success("Atendimento iniciado!");
    });
  }

  function marcarProntoParaPagamento() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await mudarStatusAgendamento(agendamento.id, "aguardando_pagamento");
      if (!res.sucesso) toast.error(res.erro);
      else {
        toast.success("Aguardando pagamento!");
        setEtapa("pagamento");
      }
    });
  }

  function confirmarCancelamento() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await cancelarAgendamentoPeloDono(agendamento.id);
      if (!res.sucesso) {
        toast.error(res.erro);
      } else {
        toast.success("Agendamento cancelado com sucesso!");
        setConfirmandoCancelamento(false);
        onFechar();
      }
    });
  }

  function handleBaixaManual() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await finalizarComBaixaManual(agendamento.id, Number(agendamento.valor), detalhePagamentoManual);
      if (!res.sucesso) {
        toast.error(res.erro);
      } else {
        toast.success("Pagamento registado e atendimento concluído!");
        onFechar();
      }
    });
  }

  function handleGerarPix() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await finalizarComPix(agendamento.id, Number(agendamento.valor));
      if (!res.sucesso) {
        toast.error(res.erro);
      } else {
        if (res.dados) setDadosPix(res.dados);
        setEtapa("pix");
        toast.success("Cobrança Pix gerada!");
      }
    });
  }

  function handlePoint() {
    if (!agendamento) return;
    startTransition(async () => {
      const res = await finalizarComPoint(agendamento.id, Number(agendamento.valor));
      if (!res.sucesso) {
        toast.error(res.erro);
      } else {
        toast.success("Ordem enviada para a maquininha Point!");
        onFechar();
      }
    });
  }

  return (
    <Modal aberto={!!agendamentoId} onFechar={onFechar} titulo="Detalhes do Agendamento">
      <div className="flex flex-col gap-6 p-1">
        {etapa === "detalhe" && (
          <>
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 p-4 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">{agendamento.cliente_nome}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{agendamento.cliente_telefone}</p>
              </div>
              <StatusBadge status={agendamento.status} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Serviços</p>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl divide-y divide-zinc-800">
                {agendamento.servicos.map((s) => (
                  <div key={s.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{s.nome}</span>
                    <span className="font-mono text-zinc-300">R$ {Number(s.preco).toFixed(2).replace(".", ",")}</span>
                  </div>
                ))}
              </div>
            </div>

            {agendamento.veiculo_modelo && (
              <div className="text-xs text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <span className="font-bold text-white">Veículo:</span> {agendamento.veiculo_modelo} {agendamento.veiculo_placa ? `(${agendamento.veiculo_placa})` : ""}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-zinc-400">Valor Total</span>
              <span className="text-xl font-black text-white font-mono">R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}</span>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-700">
              {agendamento.status === "agendado" && (
                <Button disabled={pending} onClick={iniciarAtendimento}>
                  Iniciar Atendimento
                </Button>
              )}

              {agendamento.status === "em_andamento" && (
                <Button disabled={pending} onClick={marcarProntoParaPagamento}>
                  Finalizar e Cobrar
                </Button>
              )}

              {agendamento.status === "aguardando_pagamento" && (
                <Button disabled={pending} onClick={() => setEtapa("pagamento")}>
                  Registar Pagamento
                </Button>
              )}

              {agendamento.status !== "cancelado" && agendamento.status !== "concluido" && (
                <Button variant="danger" disabled={pending} onClick={() => setConfirmandoCancelamento(true)}>
                  Cancelar Agendamento
                </Button>
              )}
            </div>
          </>
        )}

        {etapa === "pagamento" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300">Selecione a forma de pagamento recebida:</p>
            
            <button
              onClick={handleGerarPix}
              disabled={pending}
              className="w-full p-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-white">Pix Dinâmico</p>
                <p className="text-xs text-zinc-400">Gera QR Code instantâneo na tela</p>
              </div>
              <span className="text-xs font-bold text-[#E56B25]">Gerar</span>
            </button>

            <button
              onClick={handlePoint}
              disabled={pending}
              className="w-full p-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-white">Maquininha (Point)</p>
                <p className="text-xs text-zinc-400">Envia o valor direto para o dispositivo</p>
              </div>
              <span className="text-xs font-bold text-[#E56B25]">Enviar</span>
            </button>

            <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl space-y-3 mt-2">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Baixa Manual / Dinheiro / Cartão Externo</p>
              <select
                value={detalhePagamentoManual}
                onChange={(e) => setDetalhePagamentoManual(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-600 text-white text-sm outline-none"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito (Externo)</option>
                <option value="cartao_credito">Cartão de Crédito (Externo)</option>
                <option value="pix_manual">Pix (Manual / Comprovante)</option>
              </select>
              <Button disabled={pending} onClick={handleBaixaManual} className="w-full">
                Confirmar Recebimento Manual
              </Button>
            </div>

            <button onClick={() => setEtapa("detalhe")} className="text-xs text-zinc-400 hover:text-white mt-2 text-center">
              ← Voltar aos detalhes
            </button>
          </div>
        )}

        {etapa === "pix" && dadosPix && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-zinc-300">Escaneie o QR Code com o aplicativo do banco:</p>
            {dadosPix.qrCodeBase64 && (
              <img
                src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-48 h-48 bg-white p-2 rounded-xl border border-zinc-700 object-contain"
              />
            )}
            {dadosPix.copiaECola && (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  readOnly
                  value={dadosPix.copiaECola}
                  onClick={(e) => e.currentTarget.select()}
                  className="w-full text-xs p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-400 select-all"
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(dadosPix.copiaECola!);
                    toast.success("Código Pix Copia e Cola copiado!");
                  }}
                >
                  Copiar Código Pix
                </Button>
              </div>
            )}
            <button onClick={() => setEtapa("detalhe")} className="text-xs text-zinc-400 hover:text-white mt-2">
              ← Voltar
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        aberto={confirmandoCancelamento}
        titulo="Cancelar Agendamento"
        mensagem="Tem a certeza de que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        textoConfirmar="Sim, cancelar"
        destrutivo
        pending={pending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmandoCancelamento(false)}
      />
    </Modal>
  );
}