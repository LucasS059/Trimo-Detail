"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  mudarStatusAgendamento,
  cancelarAgendamentoPeloDono,
  finalizarComBaixaManual,
  finalizarComPix,
} from "@/lib/actions/agendamentos";

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
  const [mostrarPagamento, setMostrarPagamento] = useState(false);
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(pixExistente ?? null);
  const disparandoPix = useRef(false);

  function iniciarAtendimento() {
    startTransition(() => mudarStatusAgendamento(agendamentoId, "em_andamento"));
  }

  function marcarProntoParaPagamento() {
    startTransition(() => mudarStatusAgendamento(agendamentoId, "aguardando_pagamento"));
  }

  function cancelar() {
    if (!confirm("Cancelar este agendamento?")) return;
    startTransition(() => cancelarAgendamentoPeloDono(agendamentoId));
  }

  function baixaManual(detalhe: string) {
    startTransition(() => finalizarComBaixaManual({ agendamentoId, detalhe }));
    setMostrarPagamento(false);
  }

  function gerarOuReabrirPix() {
    if (dadosPix?.qrCodeBase64) {
      setModalPixAberto(true);
      return;
    }
    if (disparandoPix.current) return;
    disparandoPix.current = true;
    setMostrarPagamento(false);

    startTransition(async () => {
      try {
        const resultado = await finalizarComPix(agendamentoId);
        if (resultado) {
          setDadosPix(resultado);
          setModalPixAberto(true);
        }
      } catch (error) {
        console.error("Erro ao gerar Pix:", error);
        alert("Não foi possível gerar o Pix. Tente novamente.");
      } finally {
        disparandoPix.current = false;
      }
    });
  }

  if (status === "concluido" || status === "cancelado" || status === "nao_compareceu") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "agendado" && (
          <Button variant="secondary" disabled={pending} onClick={iniciarAtendimento}>
            Iniciar atendimento
          </Button>
        )}

        {status === "em_andamento" && (
          <Button variant="secondary" disabled={pending} onClick={marcarProntoParaPagamento}>
            Serviço pronto
          </Button>
        )}

        {status === "aguardando_pagamento" && dadosPix?.qrCodeBase64 && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setModalPixAberto(true)}
            className="border-[#E56B25] text-[#E56B25] hover:bg-[#E56B25]/5"
          >
            Ver cobrança Pix
          </Button>
        )}

        {status === "aguardando_pagamento" && !dadosPix?.qrCodeBase64 && !mostrarPagamento && (
          <Button
            disabled={pending}
            onClick={() => setMostrarPagamento(true)}
            className="bg-[#E56B25] hover:bg-[#cf5818] text-white"
          >
            Registrar pagamento
          </Button>
        )}

        {mostrarPagamento && !dadosPix?.qrCodeBase64 && (
          <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200">
            <Button variant="secondary" size="sm" disabled={pending} onClick={gerarOuReabrirPix}>
              {pending ? "Gerando..." : "Pix"}
            </Button>
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => baixaManual("dinheiro")}>
              Dinheiro
            </Button>
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => baixaManual("cartao")}>
              Cartão
            </Button>
          </div>
        )}

        <Button variant="danger" disabled={pending} onClick={cancelar}>
          Cancelar
        </Button>
      </div>

      <Modal aberto={modalPixAberto} onFechar={() => setModalPixAberto(false)} titulo="Cobrança Pix" maxWidth="max-w-sm">
        {dadosPix?.qrCodeBase64 && <ConteudoPix dadosPix={dadosPix} />}
      </Modal>
    </div>
  );
}

function ConteudoPix({ dadosPix }: { dadosPix: DadosPix }) {
  const [tempoRestante, setTempoRestante] = useState<string | null>(null);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (!dadosPix.expiraEm) return;
    const expiraEmDate = new Date(dadosPix.expiraEm);

    function atualizar() {
      const diffMs = expiraEmDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setExpirado(true);
        setTempoRestante("Expirado");
        return;
      }
      const min = Math.floor(diffMs / 60000);
      const seg = Math.floor((diffMs % 60000) / 1000);
      setTempoRestante(`${min}:${seg.toString().padStart(2, "0")}`);
    }

    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  }, [dadosPix.expiraEm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <img
          src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
          alt="QR Code Pix"
          className={`w-48 h-48 object-contain rounded-lg border border-zinc-100 ${expirado ? "opacity-30 grayscale" : ""}`}
        />
      </div>

      {tempoRestante && (
        <p className={`text-center text-sm font-mono font-bold ${expirado ? "text-red-500" : "text-zinc-700"}`}>
          {expirado ? "Cobrança expirada" : `Expira em ${tempoRestante}`}
        </p>
      )}

      <p className="text-xs text-center text-zinc-500">
        Escaneie o QR Code no app do banco do cliente ou copie o código abaixo
      </p>

      {dadosPix.copiaECola && (
        <div className="space-y-2">
          <input
            type="text"
            readOnly
            value={dadosPix.copiaECola}
            onClick={(e) => e.currentTarget.select()}
            className="w-full text-xs p-2.5 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-600 select-all"
          />
          <Button
            size="sm"
            className="w-full bg-[#E56B25] hover:bg-[#cf5818]"
            disabled={expirado}
            onClick={() => navigator.clipboard.writeText(dadosPix.copiaECola!)}
          >
            Copiar código Pix
          </Button>
        </div>
      )}

      <p className="text-[11px] text-center text-zinc-400 pt-1">
        A tela atualiza automaticamente quando o pagamento for confirmado.
      </p>
    </div>
  );
}