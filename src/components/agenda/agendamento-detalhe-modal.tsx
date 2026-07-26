"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
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
  servico_nome: string;
  veiculo_modelo: string | null;
  pix_qr_code: string | null;
  pix_copia_cola: string | null;
  pix_expira_em: string | null;
};

type Etapa = "detalhe" | "pagamento" | "pix";

type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

// --- estilos reaproveitados, isolados do JSX ---
const cx = {
  campoLabel: "text-[11px] font-semibold uppercase tracking-wider text-zinc-400",
  campoValor: "text-sm font-semibold text-zinc-900 mt-0.5",
  acaoPrimaria: "bg-[#E56B25] hover:bg-[#cf5818] text-white",
  metodoBotao:
    "flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none",
  metodoLabel: "text-sm font-semibold text-zinc-900",
  metodoDetalhe: "text-xs text-zinc-400",
  campoResumo: "flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3",
  campoPix: "w-full text-xs p-2.5 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-600 select-all",
  voltar: "text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors",
};

/**
 * Modal único do agendamento. Recebe a lista completa e apenas o id selecionado,
 * e deriva o agendamento atual dela — assim, quando o status muda no servidor
 * e a lista é revalidada, o modal reflete o dado novo automaticamente.
 */
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

  // Sempre que um novo agendamento é aberto, reseta a etapa e usa o Pix já salvo (se houver)
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

  function cancelar() {
    if (!agendamento) return;
    if (!confirm("Cancelar este agendamento?")) return;
    startTransition(() => cancelarAgendamentoPeloDono(agendamento.id));
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
    <Modal aberto={agendamento !== null} onFechar={onFechar} titulo={titulos[etapa]} maxWidth="max-w-md">
      {agendamento && etapa === "detalhe" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900">{agendamento.cliente_nome}</h3>
            <StatusBadge status={agendamento.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={cx.campoLabel}>Horário</p>
              <p className={`${cx.campoValor} font-mono tabular-nums`}>
                {new Date(agendamento.data_hora).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className={cx.campoLabel}>Valor</p>
              <p className={`${cx.campoValor} font-mono tabular-nums`}>
                R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div>
              <p className={cx.campoLabel}>Serviço</p>
              <p className={cx.campoValor}>{agendamento.servico_nome}</p>
            </div>
            <div>
              <p className={cx.campoLabel}>Veículo</p>
              <p className={cx.campoValor}>{agendamento.veiculo_modelo ?? "Não informado"}</p>
            </div>
          </div>

          {!["concluido", "cancelado", "nao_compareceu"].includes(agendamento.status) && (
            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100">
              {agendamento.status === "agendado" && (
                <Button disabled={pending} onClick={iniciarAtendimento} className={cx.acaoPrimaria}>
                  Iniciar atendimento
                </Button>
              )}

              {agendamento.status === "em_andamento" && (
                <Button disabled={pending} onClick={marcarProntoParaPagamento} className={cx.acaoPrimaria}>
                  Serviço pronto
                </Button>
              )}

              {agendamento.status === "aguardando_pagamento" && (
                <Button
                  disabled={pending}
                  onClick={() => setEtapa(dadosPix?.qrCodeBase64 ? "pix" : "pagamento")}
                  className={cx.acaoPrimaria}
                >
                  {dadosPix?.qrCodeBase64 ? "Ver cobrança Pix" : "Registrar pagamento"}
                </Button>
              )}

              <Button variant="secondary" disabled={pending} onClick={cancelar}>
                Cancelar agendamento
              </Button>
            </div>
          )}
        </div>
      )}

      {agendamento && etapa === "pagamento" && (
        <div className="flex flex-col gap-5">
          <div className={cx.campoResumo}>
            <span className="text-sm text-zinc-500">{agendamento.cliente_nome}</span>
            <span className="text-lg font-bold text-zinc-900 font-mono tabular-nums">
              R$ {Number(agendamento.valor).toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button className={cx.metodoBotao} disabled={pending} onClick={escolherPix}>
              <span className={cx.metodoLabel}>Pix</span>
              <span className={cx.metodoDetalhe}>{pending ? "Gerando..." : "QR Code e copia e cola"}</span>
            </button>
            <button className={cx.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("dinheiro")}>
              <span className={cx.metodoLabel}>Dinheiro</span>
              <span className={cx.metodoDetalhe}>Baixa manual</span>
            </button>
            <button className={cx.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("cartao")}>
              <span className={cx.metodoLabel}>Cartão</span>
              <span className={cx.metodoDetalhe}>Máquina própria</span>
            </button>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button className={cx.voltar} onClick={() => setEtapa("detalhe")}>
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
    <div className="flex flex-col gap-4">
      <div className={cx.campoResumo}>
        <span className="text-sm text-zinc-500">{clienteNome}</span>
        <span className="text-lg font-bold text-zinc-900 font-mono tabular-nums">
          R$ {valor.toFixed(2).replace(".", ",")}
        </span>
      </div>

      <div className="flex justify-center">
        <img
          src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
          alt="QR Code Pix"
          className={`w-48 h-48 object-contain rounded-lg border border-zinc-100 ${expirado ? "opacity-30 grayscale" : ""}`}
        />
      </div>

      {tempoRestante && (
        <p className={`text-center text-sm font-mono font-semibold ${expirado ? "text-red-500" : "text-zinc-700"}`}>
          {expirado ? "Cobrança expirada" : `Expira em ${tempoRestante}`}
        </p>
      )}

      {dadosPix.copiaECola && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            readOnly
            value={dadosPix.copiaECola}
            onClick={(e) => e.currentTarget.select()}
            className={cx.campoPix}
          />
          <Button
            size="sm"
            className={`w-full ${cx.acaoPrimaria}`}
            disabled={expirado}
            onClick={() => navigator.clipboard.writeText(dadosPix.copiaECola!)}
          >
            Copiar código Pix
          </Button>
        </div>
      )}

      <p className="text-[11px] text-center text-zinc-400">
        A tela atualiza automaticamente quando o pagamento for confirmado.
      </p>

      <button className={cx.voltar} onClick={onVoltar}>
        ‹ Voltar
      </button>
    </div>
  );
}