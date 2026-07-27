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
} from "@/lib/actions/agendamentos";

export type AgendamentoDetalhe = {
  id: string;
  data_hora: string;
  status: string;
  valor: string;
  cliente_nome: string;
  cliente_telefone: string;
  servico_nome: string;
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  veiculo_cor: string | null;
  pix_qr_code: string | null;
  pix_copia_cola: string | null;
  pix_expira_em: string | null;
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
  const agendamento = agendamentos.find((a) => a.id === agendamentoId) ?? null;
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("detalhe");
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);

  useEffect(() => {
    if (agendamento) {
      setEtapa("detalhe");
      setErro(null);
      setDadosPix(
        agendamento.pix_qr_code
          ? {
              qrCodeBase64: agendamento.pix_qr_code,
              copiaECola: agendamento.pix_copia_cola ?? undefined,
              expiraEm: agendamento.pix_expira_em,
            }
          : null
      );
    }
  }, [agendamento?.id]);

  function iniciarAtendimento() {
    if (!agendamento) return;
    startTransition(() => mudarStatusAgendamento(agendamento.id, "em_andamento"));
  }

  function marcarProntoParaPagamento() {
    if (!agendamento) return;
    startTransition(() => mudarStatusAgendamento(agendamento.id, "aguardando_pagamento"));
  }

  function pedirCancelamento() {
    setConfirmandoCancelamento(true);
  }

  function confirmarCancelamento() {
    if (!agendamento) return;
    startTransition(() => cancelarAgendamentoPeloDono(agendamento.id));
    setConfirmandoCancelamento(false);
    onFechar();
  }

  function escolherPix() {
    if (!agendamento) return;
    if (dadosPix?.qrCodeBase64) {
      setEtapa("pix");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await finalizarComPix(agendamento.id);
        setDadosPix(resultado);
        setEtapa("pix");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível gerar o Pix.");
      }
    });
  }

  function escolherBaixaManual(detalhe: "dinheiro" | "cartao") {
    if (!agendamento) return;
    setErro(null);
    startTransition(async () => {
      try {
        await finalizarComBaixaManual({ agendamentoId: agendamento.id, detalhe });
        onFechar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível registrar o pagamento.");
      }
    });
  }

  const titulos: Record<Etapa, string> = {
    detalhe: "Agendamento",
    pagamento: "Registrar pagamento",
    pix: "Cobrança Pix",
  };

  return (
    <>
      <Modal aberto={agendamento !== null} onFechar={onFechar} titulo={titulos[etapa]} maxWidth="max-w-md">
        {agendamento && etapa === "detalhe" && (
          <div className={styles.wrapperDetalhe}>
            <div className={styles.headerCliente}>
              <div>
                <h3 className={styles.nomeCliente}>{agendamento.cliente_nome}</h3>
                <p className={styles.telefoneCliente}>{agendamento.cliente_telefone}</p>
              </div>
              <StatusBadge status={agendamento.status} />
            </div>

            {agendamento.veiculo_modelo && (
              <div className={styles.cardVeiculo}>
                <p className={styles.veiculoNome}>
                  {agendamento.veiculo_modelo}
                  {agendamento.veiculo_cor ? ` - ${agendamento.veiculo_cor}` : ""}
                </p>
                {agendamento.veiculo_placa && (
                  <p className={styles.veiculoPlaca}>{agendamento.veiculo_placa}</p>
                )}
              </div>
            )}

            <div className={styles.gridInfo}>
              <div>
                <p className={styles.campoLabel}>Horário</p>
                <p className={styles.campoValorMono}>
                  {new Date(agendamento.data_hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className={styles.campoLabel}>Valor</p>
                <p className={styles.campoValorMono}>
                  R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className={styles.campoServico}>
                <p className={styles.campoLabel}>Serviço</p>
                <p className={styles.campoValor}>{agendamento.servico_nome}</p>
              </div>
            </div>

            {!["concluido", "cancelado", "nao_compareceu"].includes(agendamento.status) && (
              <div className={styles.acoes}>
                {agendamento.status === "agendado" && (
                  <Button disabled={pending} onClick={iniciarAtendimento} className={styles.acaoPrimaria}>
                    Iniciar atendimento
                  </Button>
                )}

                {agendamento.status === "em_andamento" && (
                  <Button disabled={pending} onClick={marcarProntoParaPagamento} className={styles.acaoPrimaria}>
                    Serviço pronto
                  </Button>
                )}

                {agendamento.status === "aguardando_pagamento" && (
                  <Button
                    disabled={pending}
                    onClick={() => setEtapa(dadosPix?.qrCodeBase64 ? "pix" : "pagamento")}
                    className={styles.acaoPrimaria}
                  >
                    {dadosPix?.qrCodeBase64 ? "Ver cobrança Pix" : "Registrar pagamento"}
                  </Button>
                )}

                <Button variant="secondary" disabled={pending} onClick={pedirCancelamento}>
                  Cancelar agendamento
                </Button>
              </div>
            )}
          </div>
        )}

        {agendamento && etapa === "pagamento" && (
          <div className={styles.wrapperPagamento}>
            <div className={styles.campoResumo}>
              <span className={styles.resumoNome}>{agendamento.cliente_nome}</span>
              <span className={styles.resumoValor}>
                R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className={styles.listaMetodos}>
              <button className={styles.metodoBotao} disabled={pending} onClick={escolherPix}>
                <span className={styles.metodoLabel}>Pix</span>
                <span className={styles.metodoDetalhe}>{pending ? "Gerando..." : "QR Code e copia e cola"}</span>
              </button>
              <button className={styles.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("dinheiro")}>
                <span className={styles.metodoLabel}>Dinheiro</span>
                <span className={styles.metodoDetalhe}>Baixa manual</span>
              </button>
              <button className={styles.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("cartao")}>
                <span className={styles.metodoLabel}>Cartão</span>
                <span className={styles.metodoDetalhe}>Máquina própria</span>
              </button>
            </div>

            {erro && <p className={styles.erro}>{erro}</p>}

            <button className={styles.voltar} onClick={() => setEtapa("detalhe")}>
              ‹ Voltar
            </button>
          </div>
        )}

        {agendamento && etapa === "pix" && dadosPix?.qrCodeBase64 && (
          <ConteudoPix
            dadosPix={dadosPix}
            valor={Number(agendamento.valor)}
            clienteNome={agendamento.cliente_nome}
            onVoltar={() => setEtapa("detalhe")}
          />
        )}
      </Modal>

      <ConfirmModal
        aberto={confirmandoCancelamento}
        titulo="Cancelar agendamento"
        mensagem={`Tem certeza que deseja cancelar o agendamento de ${agendamento?.cliente_nome ?? ""}? Essa ação não pode ser desfeita.`}
        textoConfirmar="Cancelar agendamento"
        textoCancelar="Voltar"
        destrutivo
        pending={pending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmandoCancelamento(false)}
      />
    </>
  );
}

function ConteudoPix({
  dadosPix,
  valor,
  clienteNome,
  onVoltar,
}: {
  dadosPix: DadosPix;
  valor: number;
  clienteNome: string;
  onVoltar: () => void;
}) {
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
      <div className={styles.campoResumo}>
        <span className={styles.resumoNome}>{clienteNome}</span>
        <span className={styles.resumoValor}>
          R$ {valor.toFixed(2).replace(".", ",")}
        </span>
      </div>

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

      {dadosPix.copiaECola && (
        <div className={styles.pixCopiaWrapper}>
          <input
            type="text"
            readOnly
            value={dadosPix.copiaECola}
            onClick={(e) => e.currentTarget.select()}
            className={styles.campoPix}
          />
          <Button
            size="sm"
            className={`w-full ${styles.acaoPrimaria}`}
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

      <button className={styles.voltar} onClick={onVoltar}>
        ‹ Voltar
      </button>
    </div>
  );
}

const styles = {
  wrapperDetalhe: "flex flex-col gap-5",
  headerCliente: "flex items-start justify-between gap-3",
  nomeCliente: "text-lg font-bold text-white leading-tight",
  telefoneCliente: "text-xs text-zinc-400 mt-0.5",

  cardVeiculo: "bg-zinc-900 border border-zinc-600 rounded-xl px-4 py-3",
  veiculoNome: "text-sm font-semibold text-white",
  veiculoPlaca: "text-xs text-zinc-400 mt-0.5",

  gridInfo: "grid grid-cols-2 gap-4",
  campoServico: "col-span-2",
  campoLabel: "text-[11px] font-semibold uppercase tracking-wider text-zinc-400",
  campoValor: "text-sm font-semibold text-white mt-0.5",
  campoValorMono: "text-sm font-semibold text-white mt-0.5 font-mono tabular-nums",

  acoes: "flex flex-col gap-2 pt-4 border-t border-zinc-700",
  acaoPrimaria: "bg-[#E56B25] hover:bg-[#cf5818] text-white",

  wrapperPagamento: "flex flex-col gap-5",
  campoResumo: "flex items-center justify-between bg-zinc-900 border border-zinc-600 rounded-xl px-4 py-3",
  resumoNome: "text-sm text-zinc-300",
  resumoValor: "text-lg font-bold text-white font-mono tabular-nums",

  listaMetodos: "flex flex-col gap-2",
  metodoBotao:
    "flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-zinc-600 bg-zinc-900 hover:border-zinc-500 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none",
  metodoLabel: "text-sm font-semibold text-white",
  metodoDetalhe: "text-xs text-zinc-400",

  erro: "text-sm text-red-400",
  voltar: "text-xs font-semibold text-zinc-400 hover:text-white transition-colors",

  wrapperPix: "flex flex-col gap-4",
  qrWrapper: "flex justify-center",
  qrImagem: "w-48 h-48 object-contain rounded-lg border border-zinc-600 bg-white p-2",
  qrExpirado: "opacity-30 grayscale",

  tempoAtivo: "text-center text-sm font-mono font-semibold text-zinc-300",
  tempoExpirado: "text-center text-sm font-mono font-semibold text-red-400",

  pixCopiaWrapper: "flex flex-col gap-2",
  campoPix: "w-full text-xs p-2.5 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-200 select-all",

  avisoAtualizacao: "text-[11px] text-center text-zinc-400",
};