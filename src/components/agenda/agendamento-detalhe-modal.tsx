"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Car,
  User,
  Phone,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  CreditCard,
  QrCode,
  DollarSign,
  ArrowLeft,
  XCircle,
  Play,
  Check
} from "lucide-react";

import {
  mudarStatusAgendamento,
  cancelarAgendamentoPeloDono,
  finalizarComBaixaManual,
  finalizarComPix,
  finalizarComPoint,
  enviarLembreteWhatsAppAction,
} from "@/lib/actions/agendamentos";
import { toast } from "sonner";
import { gerarLinkWhatsApp, gerarMensagemProntaWhatsApp } from "@/lib/utils/whatsapp-link";
import { formatarMoeda } from "@/lib/formatters";

export type ServicoDoAgendamento = {
  id: string;
  nome: string;
  preco: number | string;
  duracaoMinutos: number;
};

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
  observacoes?: string | null;
  veiculo_modelo: string | null;
  veiculo_placa: string | null;
  servicos: ServicoDoAgendamento[];
};

type Etapa = "detalhe" | "pagamento" | "pix";
type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

function formatarDuracao(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

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
  const [enviandoLembrete, setEnviandoLembrete] = useState(false);
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

  const dataAgendamento = new Date(agendamento.data_hora);
  const dataFormatada = dataAgendamento.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const horaFormatada = dataAgendamento.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

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
        toast.success("Serviço concluído! Selecione a forma de recebimento.");
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

  function handleDispararLembrete() {
    if (!agendamento) return;
    setEnviandoLembrete(true);
    startTransition(async () => {
      try {
        const res = await enviarLembreteWhatsAppAction(agendamento.id);
        if (res.sucesso) {
          toast.success("Lembrete enviado ao cliente via WhatsApp!");
        } else {
          toast.error(res.erro || "Falha ao enviar lembrete.");
        }
      } catch (err) {
        toast.error("Erro ao enviar mensagem.");
      } finally {
        setEnviandoLembrete(false);
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
        toast.success("Pagamento registrado e agendamento concluído!");
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
        toast.success("QR Code Pix gerado com sucesso!");
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

  // Define os botões fixos do footer de acordo com a etapa
  const renderFooter = () => {
    if (etapa === "detalhe") {
      return (
        <>
          {/* Ações secundárias / destrutivas à esquerda */}
          <div>
            {agendamento.status !== "cancelado" && agendamento.status !== "concluido" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmandoCancelamento(true)}
                className="px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancelar Agendamento
              </button>
            ) : (
              <span className="text-xs text-zinc-500 font-medium">Atendimento finalizado</span>
            )}
          </div>

          {/* Ações principais de fluxo à direita */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {agendamento.status === "agendado" && (
              <button
                type="button"
                disabled={pending}
                onClick={iniciarAtendimento}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E56B25] hover:bg-[#cf5818] rounded-xl transition-colors shadow-sm shadow-[#E56B25]/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Atendimento
              </button>
            )}

            {agendamento.status === "em_andamento" && (
              <button
                type="button"
                disabled={pending}
                onClick={marcarProntoParaPagamento}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Finalizar e Cobrar
              </button>
            )}

            {agendamento.status === "aguardando_pagamento" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setEtapa("pagamento")}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Registrar Pagamento
              </button>
            )}
          </div>
        </>
      );
    }

    if (etapa === "pagamento") {
      return (
        <>
          <button
            type="button"
            onClick={() => setEtapa("detalhe")}
            className="px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar aos Detalhes
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </>
      );
    }

    if (etapa === "pix") {
      return (
        <>
          <button
            type="button"
            onClick={() => setEtapa("pagamento")}
            className="px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Outras Formas de Pagamento
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            Concluir / Fechar
          </button>
        </>
      );
    }
  };

  return (
    <Modal
      aberto={!!agendamentoId}
      onFechar={onFechar}
      titulo={`Agendamento #${agendamento.codigo}`}
      maxWidth="max-w-xl"
      footer={renderFooter()}
    >
      {etapa === "detalhe" && (
        <div className="space-y-4">
          {/* Card 1: Data, Horário e Status */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-bold text-sm capitalize">
                <Calendar className="w-4 h-4 text-[#E56B25]" />
                {dataFormatada}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1 font-semibold text-zinc-200">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {horaFormatada}
                </span>
                <span>•</span>
                <span>Duração: {formatarDuracao(agendamento.duracao_minutos)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={agendamento.status} />
              {agendamento.presenca_confirmada ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3 h-3" />
                  Presença Confirmada
                </span>
              ) : (
                <span className="text-xs text-zinc-300 font-medium px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg">
                  Aguardando confirmação
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Cliente e Ações Rápidas de Contato */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 font-bold text-sm">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{agendamento.cliente_nome}</p>
                  <p className="text-xs text-zinc-300 font-medium mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {agendamento.cliente_telefone}
                  </p>
                </div>
              </div>

              {/* Botões de Ação para o Cliente */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={gerarLinkWhatsApp(
                    agendamento.cliente_telefone,
                    gerarMensagemProntaWhatsApp(
                      agendamento.status === "aguardando_pagamento" ? "pronto" :
                      agendamento.status === "em_andamento" ? "iniciado" : "lembrete",
                      { nomeCliente: agendamento.cliente_nome }
                    )
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                  title="Abrir WhatsApp oficial para conversar com o cliente"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.188 8.188 0 0 1-5.82 2.42c-1.44 0-2.86-.38-4.12-1.1l-.3-.18-3.12.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.43c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
                  </svg>
                  WhatsApp
                </a>

                {agendamento.status === "agendado" && (
                  <button
                    type="button"
                    disabled={enviandoLembrete || pending}
                    onClick={handleDispararLembrete}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    title="Dispara o lembrete de presença automático pelo WhatsApp integrado"
                  >
                    <Send className="w-3.5 h-3.5 text-[#E56B25]" />
                    {enviandoLembrete ? "Enviando..." : "Lembrete"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Veículo do Cliente */}
          {agendamento.veiculo_modelo && (
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Veículo</p>
                  <p className="text-sm font-bold text-white uppercase">{agendamento.veiculo_modelo}</p>
                </div>
              </div>

              {agendamento.veiculo_placa && (
                <div className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-black text-white tracking-wider">
                  {agendamento.veiculo_placa}
                </div>
              )}
            </div>
          )}

          {/* Card 4: Serviços Contratados e Resumo de Valores */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Serviços ({agendamento.servicos.length})
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Valor Unitário</span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {agendamento.servicos.map((s) => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white font-semibold text-xs sm:text-sm">{s.nome}</p>
                    <p className="text-xs text-zinc-300 font-medium mt-0.5">{formatarDuracao(s.duracaoMinutos)} de duração estimada</p>
                  </div>
                  <span className="font-bold text-zinc-200 tabular-nums text-xs sm:text-sm">
                    {formatarMoeda(Number(s.preco))}
                  </span>
                </div>
              ))}
            </div>

            {/* Totalizador */}
            <div className="px-4 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Total do Agendamento</span>
                <span className="text-xs text-zinc-300 font-medium">Cobrado ao concluir o serviço</span>
              </div>
              <span className="text-xl font-black text-white tabular-nums">
                {formatarMoeda(Number(agendamento.valor))}
              </span>
            </div>
          </div>

          {/* Card 5: Observações se existirem */}
          {agendamento.observacoes && (
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#E56B25]" />
                Observações do Agendamento
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed">{agendamento.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* ETAPA 2: Escolha de Pagamento */}
      {etapa === "pagamento" && (
        <div className="space-y-4">
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase">Valor a Receber</p>
              <p className="text-xl font-black text-white tabular-nums mt-0.5">
                {formatarMoeda(Number(agendamento.valor))}
              </p>
            </div>
            <StatusBadge status="aguardando_pagamento" />
          </div>

          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            Selecione o Meio de Pagamento
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opção 1: Pix Dinâmico */}
            <button
              type="button"
              onClick={handleGerarPix}
              disabled={pending}
              className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-[#E56B25]/50 text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#E56B25] group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Pix Dinâmico</p>
                <p className="text-xs text-zinc-400 mt-0.5">Gera QR Code na tela com baixa automática</p>
              </div>
            </button>

            {/* Opção 2: Maquininha Point */}
            <button
              type="button"
              onClick={handlePoint}
              disabled={pending}
              className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-[#E56B25]/50 text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#E56B25] group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Maquininha Point</p>
                <p className="text-xs text-zinc-400 mt-0.5">Envia o valor direto para o dispositivo</p>
              </div>
            </button>
          </div>

          {/* Opção 3: Baixa Manual */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
              Baixa Manual / Dinheiro / Outros
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={detalhePagamentoManual}
                onChange={(e) => setDetalhePagamentoManual(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm outline-none focus:border-[#E56B25]"
              >
                <option value="dinheiro">Dinheiro Físico</option>
                <option value="cartao_debito">Cartão de Débito (Externo)</option>
                <option value="cartao_credito">Cartão de Crédito (Externo)</option>
                <option value="pix_manual">Pix Manual (Comprovante / Chave própria)</option>
              </select>

              <button
                type="button"
                disabled={pending}
                onClick={handleBaixaManual}
                className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: Exibição do Pix Dinâmico */}
      {etapa === "pix" && dadosPix && (
        <div className="space-y-4 py-2 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
            <QrCode className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">QR Code Pix Pronto</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Aponte a câmera do aplicativo do banco para receber {formatarMoeda(Number(agendamento.valor))}
            </p>
          </div>

          {dadosPix.qrCodeBase64 && (
            <div className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-700">
              <img
                src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-52 h-52 object-contain rounded-lg"
              />
            </div>
          )}

          {dadosPix.copiaECola && (
            <div className="w-full max-w-md space-y-2">
              <input
                type="text"
                readOnly
                value={dadosPix.copiaECola}
                onClick={(e) => e.currentTarget.select()}
                className="w-full text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 font-sans select-all outline-none"
              />
              <button
                type="button"
                className="w-full h-10 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold transition-colors cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(dadosPix.copiaECola!);
                  toast.success("Código Copia e Cola copiado com sucesso!");
                }}
              >
                Copiar Chave Copia e Cola
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        aberto={confirmandoCancelamento}
        titulo="Cancelar Agendamento"
        mensagem="Tem certeza de que deseja cancelar este agendamento? Esta ação notificará o cliente e liberará o horário na agenda."
        textoConfirmar="Sim, cancelar agendamento"
        destrutivo
        pending={pending}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setConfirmandoCancelamento(false)}
      />
    </Modal>
  );
}
