"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [erroPix, setErroPix] = useState<string | null>(null);
  const disparandoPix = useRef(false);

  function iniciarAtendimento() {
    startTransition(() => mudarStatusAgendamento(agendamentoId, "em_andamento"));
  }

  function marcarProntoParaPagamento() {
    startTransition(() => mudarStatusAgendamento(agendamentoId, "aguardando_pagamento"));
  }

  function confirmarCancelamento() {
    startTransition(() => cancelarAgendamentoPeloDono(agendamentoId));
    setConfirmandoCancelamento(false);
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
    setErroPix(null);

    startTransition(async () => {
      try {
        const resultado = await finalizarComPix(agendamentoId);
        if (resultado) {
          setDadosPix(resultado);
          setModalPixAberto(true);
        }
      } catch (error) {
        console.error("Erro ao gerar Pix:", error);
        setErroPix("Não foi possível gerar o Pix. Tente novamente.");
      } finally {
        disparandoPix.current = false;
      }
    });
  }

  if (status === "concluido" || status === "cancelado" || status === "nao_compareceu") {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.linhaBotoes}>
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
          <Button variant="secondary" disabled={pending} onClick={() => setModalPixAberto(true)} className={styles.botaoVerPix}>
            Ver cobrança Pix
          </Button>
        )}

        {status === "aguardando_pagamento" && !dadosPix?.qrCodeBase64 && !mostrarPagamento && (
          <Button disabled={pending} onClick={() => setMostrarPagamento(true)} className={styles.botaoRegistrarPagamento}>
            Registrar pagamento
          </Button>
        )}

        {mostrarPagamento && !dadosPix?.qrCodeBase64 && (
          <div className={styles.opcoesPagamento}>
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

        <Button variant="danger" disabled={pending} onClick={() => setConfirmandoCancelamento(true)}>
          Cancelar
        </Button>
      </div>

      {erroPix && <p className={styles.erroPix}>{erroPix}</p>}

      <Modal aberto={modalPixAberto} onFechar={() => setModalPixAberto(false)} titulo="Cobrança Pix" maxWidth="max-w-sm">
        {dadosPix?.qrCodeBase64 && <ConteudoPix dadosPix={dadosPix} />}
      </Modal>

      <ConfirmModal
        aberto={confirmandoCancelamento}
        titulo="Cancelar agendamento"
        mensagem="Tem certeza que deseja cancelar este agendamento? Essa ação não pode ser desfeita."
        textoConfirmar="Cancelar agendamento"
        textoCancelar="Voltar"
        destrutivo
        pending={pending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmandoCancelamento(false)}
      />
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
    <div className={styles.wrapperPix}>
      <div className={styles.qrWrapper}>
        <img
          src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
          alt="QR Code Pix"
          className={`${styles.qrImagem} ${expirado ? styles.qrExpirado : ""}`}
        />
      </div>

      {tempoRestante && (
        <p className={expirado ? styles.tempoExpirado : styles.tempoAtivo}>
          {expirado ? "Cobrança expirada" : `Expira em ${tempoRestante}`}
        </p>
      )}

      <p className={styles.instrucaoPix}>
        Escaneie o QR Code no app do banco do cliente ou copie o código abaixo
      </p>

      {dadosPix.copiaECola && (
        <div className={styles.copiaWrapper}>
          <input
            type="text"
            readOnly
            value={dadosPix.copiaECola}
            onClick={(e) => e.currentTarget.select()}
            className={styles.campoPix}
          />
          <Button
            size="sm"
            className={`w-full ${styles.botaoCopiar}`}
            disabled={expirado}
            onClick={() => navigator.clipboard.writeText(dadosPix.copiaECola!)}
          >
            Copiar código Pix
          </Button>
        </div>
      )}

      <p className={styles.avisoAtualizacao}>
        A tela atualiza automaticamente quando o pagamento for confirmado.
      </p>
    </div>
  );
}

const styles = {
  wrapper: "flex flex-col gap-3",
  linhaBotoes: "flex flex-wrap items-center gap-2",
  botaoVerPix: "border-[#E56B25] text-[#E56B25] hover:bg-[#E56B25]/10",
  botaoRegistrarPagamento: "bg-[#E56B25] hover:bg-[#cf5818] text-white",
  opcoesPagamento: "flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-600",
  erroPix: "text-sm text-red-400",

  wrapperPix: "flex flex-col gap-4",
  qrWrapper: "flex justify-center",
  qrImagem: "w-48 h-48 object-contain rounded-lg border border-zinc-600 bg-white p-2",
  qrExpirado: "opacity-30 grayscale",
  tempoAtivo: "text-center text-sm font-mono font-semibold text-zinc-300",
  tempoExpirado: "text-center text-sm font-mono font-semibold text-red-400",
  instrucaoPix: "text-xs text-center text-zinc-400",
  copiaWrapper: "flex flex-col gap-2",
  campoPix: "w-full text-xs p-2.5 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-200 select-all",
  botaoCopiar: "bg-[#E56B25] hover:bg-[#cf5818] text-white",
  avisoAtualizacao: "text-[11px] text-center text-zinc-400",
};