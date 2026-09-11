"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  History,
  Plus,
  Phone,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  MapPin,
  XCircle,
  Check,
  Loader2,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import {
  atualizarDadosClientePeloPortalAction,
  adicionarVeiculoPeloPortalAction
} from "@/lib/actions/portal-cliente";

export interface PortalAgendamento {
  id: string;
  data_hora: string | Date;
  status: "agendado" | "em_andamento" | "aguardando_pagamento" | "concluido" | "cancelado" | "nao_compareceu";
  servico_nome: string;
  servico_preco: number;
  duracao_minutos: number;
  observacoes?: string | null;
  loja_id: string;
  loja_nome: string;
  loja_slug: string;
  loja_telefone?: string | null;
  loja_endereco?: string | null;
  loja_tempo_cancelamento_horas?: number;
  veiculo_modelo: string;
  veiculo_placa: string;
  veiculo_cor: string;
  veiculo_categoria?: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string | null;
}

export interface PortalVeiculo {
  id: string;
  modelo: string;
  marca?: string | null;
  placa: string;
  cor?: string | null;
  categoria?: string | null;
}

interface PortalClienteProps {
  agendamentoAtual: PortalAgendamento;
  historico: PortalAgendamento[];
  veiculos: PortalVeiculo[];
}

const ETAPAS_STATUS = [
  { chave: "agendado", rotulo: "Agendado", desc: "Horário reservado no box" },
  { chave: "em_andamento", rotulo: "Em Andamento", desc: "Trabalho sendo realizado no veículo" },
  { chave: "aguardando_pagamento", rotulo: "Pronto / Pagamento", desc: "Serviço finalizado, aguardando acerto" },
  { chave: "concluido", rotulo: "Concluído", desc: "Veículo entregue e pagamento aprovado" }
];

export function PortalCliente({ agendamentoAtual: inicialAgendamento, historico, veiculos: inicialVeiculos }: PortalClienteProps) {
  const [abaAtiva, setAbaAtiva] = useState<"acompanhar" | "historico" | "garagem">("acompanhar");
  const [agendamentoAtivo, setAgendamentoAtivo] = useState<PortalAgendamento>(inicialAgendamento);
  const [veiculos, setVeiculos] = useState<PortalVeiculo[]>(inicialVeiculos);

  const [isPending, startTransition] = useTransition();
  const [nomeCliente, setNomeCliente] = useState(agendamentoAtivo.cliente_nome || "");
  const [emailCliente, setEmailCliente] = useState(agendamentoAtivo.cliente_email || "");
  const [msgPerfil, setMsgPerfil] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [novoModelo, setNovoModelo] = useState("");
  const [novaMarca, setNovaMarca] = useState("");
  const [novaPlaca, setNovaPlaca] = useState("");
  const [novaCor, setNovaCor] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("pequeno");
  const [msgVeiculo, setMsgVeiculo] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [msgCancelamento, setMsgCancelamento] = useState<string | null>(null);

  const formatarData = (dataStr: string | Date) => {
    const d = new Date(dataStr);
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  const indiceStatus = ETAPAS_STATUS.findIndex((e) => e.chave === agendamentoAtivo.status);
  const isCancelado = agendamentoAtivo.status === "cancelado";
  const isNaoCompareceu = agendamentoAtivo.status === "nao_compareceu";

  const limiteHorasCancelamento = agendamentoAtivo.loja_tempo_cancelamento_horas ?? 1;
  const dataAgendamento = new Date(agendamentoAtivo.data_hora);
  const agora = new Date();
  const diferencaHoras = (dataAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);
  const podeCancelar = agendamentoAtivo.status === "agendado" && diferencaHoras >= limiteHorasCancelamento;

  const handleSalvarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setMsgPerfil(null);
    startTransition(async () => {
      const res = await atualizarDadosClientePeloPortalAction({
        clienteId: agendamentoAtivo.cliente_id,
        lojaId: agendamentoAtivo.loja_id,
        nome: nomeCliente,
        email: emailCliente
      });
      if (res.sucesso) {
        setMsgPerfil({ tipo: "sucesso", texto: "Seus dados foram atualizados com sucesso." });
      } else {
        setMsgPerfil({ tipo: "erro", texto: res.erro || "Falha ao salvar dados." });
      }
    });
  };

  const handleAdicionarVeiculo = (e: React.FormEvent) => {
    e.preventDefault();
    setMsgVeiculo(null);
    startTransition(async () => {
      const res = await adicionarVeiculoPeloPortalAction({
        clienteId: agendamentoAtivo.cliente_id,
        modelo: novoModelo,
        marca: novaMarca,
        placa: novaPlaca.toUpperCase(),
        cor: novaCor,
        categoria: novaCategoria
      });
      if (res.sucesso && res.veiculo) {
        setVeiculos((prev) => [...prev, res.veiculo!]);
        setMsgVeiculo({ tipo: "sucesso", texto: "Veículo cadastrado na sua garagem com sucesso." });
        setNovoModelo("");
        setNovaMarca("");
        setNovaPlaca("");
        setNovaCor("");
      } else {
        setMsgVeiculo({ tipo: "erro", texto: res.erro || "Falha ao cadastrar veículo." });
      }
    });
  };

  const handleCancelarAgendamento = async () => {
    setCancelando(true);
    setMsgCancelamento(null);
    try {
      const res = await fetch(`/api/agendamentos/${agendamentoAtivo.id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.ok) {
        setAgendamentoAtivo((prev) => ({ ...prev, status: "cancelado" }));
        setConfirmandoCancelamento(false);
        setMsgCancelamento("Agendamento cancelado com sucesso.");
      } else {
        setMsgCancelamento(data.erro || "Não foi possível cancelar o agendamento.");
      }
    } catch {
      setMsgCancelamento("Erro de conexão ao solicitar cancelamento.");
    } finally {
      setCancelando(false);
    }
  };

  const linkWhatsAppLoja = agendamentoAtivo.loja_telefone
    ? `https://wa.me/55${agendamentoAtivo.loja_telefone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá! Sou o(a) ${agendamentoAtivo.cliente_nome}, proprietário(a) do ${agendamentoAtivo.veiculo_modelo} (${agendamentoAtivo.veiculo_placa}). Gostaria de falar sobre meu agendamento #${agendamentoAtivo.id.slice(0, 8)}.`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-[#E56B25] selection:text-white pb-16">
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E56B25] to-[#c75517] flex items-center justify-center shadow-lg shadow-[#E56B25]/20 text-white">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#E56B25]">
                  Portal do Cliente
                </span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400 font-medium">{agendamentoAtivo.loja_nome}</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {agendamentoAtivo.cliente_nome}
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setAbaAtiva("acompanhar")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "acompanhar"
                  ? "bg-[#E56B25] text-white font-semibold shadow-md shadow-[#E56B25]/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              Acompanhamento
            </button>
            <button
              onClick={() => setAbaAtiva("historico")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "historico"
                  ? "bg-[#E56B25] text-white font-semibold shadow-md shadow-[#E56B25]/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <History className="w-4 h-4" />
              Histórico ({historico.length})
            </button>
            <button
              onClick={() => setAbaAtiva("garagem")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                abaAtiva === "garagem"
                  ? "bg-[#E56B25] text-white font-semibold shadow-md shadow-[#E56B25]/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Car className="w-4 h-4" />
              Garagem ({veiculos.length})
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {abaAtiva === "acompanhar" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#E56B25]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                    <Car className="w-3.5 h-3.5 text-[#E56B25]" />
                    <span>Veículo do Atendimento</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {agendamentoAtivo.veiculo_modelo}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-950 font-mono font-bold text-zinc-200 border border-zinc-800 tracking-wider">
                      {agendamentoAtivo.veiculo_placa}
                    </span>
                    <span>Cor: {agendamentoAtivo.veiculo_cor}</span>
                    {agendamentoAtivo.veiculo_categoria && (
                      <span className="capitalize">Categoria: {agendamentoAtivo.veiculo_categoria}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-xs text-zinc-400">Horário Previsto</span>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Calendar className="w-4 h-4 text-[#E56B25]" />
                    <span>{formatarData(agendamentoAtivo.data_hora)}</span>
                  </div>
                  <span className="text-xs text-zinc-500">
                    Duração estimada: ~{agendamentoAtivo.duracao_minutos} min
                  </span>
                </div>
              </div>

              <div className="py-8">
                <h3 className="text-sm font-semibold text-zinc-300 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E56B25]" />
                  Status do Detailing
                </h3>

                {isCancelado ? (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 flex items-center gap-3 text-red-300">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Este agendamento foi cancelado.</p>
                      <p className="text-xs text-red-400/80">Para realizar um novo serviço, faça um novo agendamento na página da estética.</p>
                    </div>
                  </div>
                ) : isNaoCompareceu ? (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex items-center gap-3 text-amber-300">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Não comparecimento registrado.</p>
                      <p className="text-xs text-amber-400/80">O horário agendado expirou sem confirmação de chegada no box.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                    {ETAPAS_STATUS.map((etapa, idx) => {
                      const concluida = indiceStatus > idx;
                      const atual = indiceStatus === idx;

                      return (
                        <div
                          key={etapa.chave}
                          className={`p-4 rounded-xl border transition-all ${
                            atual
                              ? "bg-[#E56B25]/10 border-[#E56B25]/60 shadow-lg shadow-[#E56B25]/10"
                              : concluida
                              ? "bg-zinc-950/60 border-zinc-800 text-zinc-400"
                              : "bg-zinc-950/30 border-zinc-800/60 opacity-60 text-zinc-500"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                atual
                                  ? "bg-[#E56B25] text-white"
                                  : concluida
                                  ? "bg-emerald-500 text-white"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {concluida ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                atual ? "text-white" : concluida ? "text-zinc-200" : "text-zinc-400"
                              }`}
                            >
                              {etapa.rotulo}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{etapa.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Serviço Selecionado
                  </span>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white text-base">{agendamentoAtivo.servico_nome}</h4>
                      <span className="text-lg font-extrabold text-[#E56B25]">
                        {formatarMoeda(agendamentoAtivo.servico_preco)}
                      </span>
                    </div>
                    {agendamentoAtivo.observacoes && (
                      <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-900">
                        <strong className="text-zinc-300">Obs:</strong> {agendamentoAtivo.observacoes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Local & Contato da Estética
                  </span>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <MapPin className="w-4 h-4 text-[#E56B25] shrink-0 mt-0.5" />
                      <span>{agendamentoAtivo.loja_endereco || "Endereço cadastrado na estética"}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {linkWhatsAppLoja && (
                        <a
                          href={linkWhatsAppLoja}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Falar no WhatsApp
                        </a>
                      )}
                      <Link
                        href={`/${agendamentoAtivo.loja_slug}`}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold hover:bg-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Página da Loja
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-[#E56B25]" />
                  <span>Código de identificação: {agendamentoAtivo.id}</span>
                </div>

                {podeCancelar && !confirmandoCancelamento && (
                  <button
                    onClick={() => setConfirmandoCancelamento(true)}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/30 hover:border-red-500 text-xs font-semibold transition-all"
                  >
                    Cancelar este agendamento
                  </button>
                )}

                {confirmandoCancelamento && (
                  <div className="p-3 bg-red-950/40 border border-red-900 rounded-xl flex items-center gap-3">
                    <span className="text-xs text-red-300">Tem certeza que deseja cancelar?</span>
                    <button
                      onClick={handleCancelarAgendamento}
                      disabled={cancelando}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {cancelando && <Loader2 className="w-3 h-3 animate-spin" />}
                      Sim, cancelar
                    </button>
                    <button
                      onClick={() => setConfirmandoCancelamento(false)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 font-semibold text-xs hover:bg-zinc-700 transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                )}

                {msgCancelamento && (
                  <p className="w-full text-xs font-medium text-amber-300 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-lg">
                    {msgCancelamento}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "historico" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Histórico de Atendimentos</h2>
                <p className="text-xs text-zinc-400">Todos os seus serviços contratados nesta estética automotiva.</p>
              </div>
              <Link
                href={`/${agendamentoAtivo.loja_slug}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E56B25] text-white font-semibold text-xs hover:bg-[#c75517] transition-all shadow-md shadow-[#E56B25]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Agendamento
              </Link>
            </div>

            {historico.length === 0 ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
                <History className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="font-semibold text-sm">Nenhum atendimento registrado anteriormente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {historico.map((item) => {
                  const isAtual = item.id === agendamentoAtivo.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAtual
                          ? "bg-zinc-900 border-[#E56B25]/50 shadow-md shadow-[#E56B25]/10"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{item.servico_nome}</span>
                            {isAtual && (
                              <span className="px-2 py-0.5 rounded-full bg-[#E56B25]/20 text-[#E56B25] text-xs font-semibold border border-[#E56B25]/30">
                                Visualizando Agora
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span className="font-medium text-zinc-300">
                              {item.veiculo_modelo} ({item.veiculo_placa})
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#E56B25]" />
                              {formatarData(item.data_hora)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-bold text-white block">
                              {formatarMoeda(item.servico_preco)}
                            </span>
                            <span
                              className={`text-[11px] font-semibold uppercase tracking-wider ${
                                item.status === "concluido"
                                  ? "text-emerald-400"
                                  : item.status === "cancelado"
                                  ? "text-red-400"
                                  : item.status === "em_andamento"
                                  ? "text-cyan-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                          </div>

                          {!isAtual && (
                            <button
                              onClick={() => {
                                setAgendamentoAtivo(item);
                                setAbaAtiva("acompanhar");
                              }}
                              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              title="Acompanhar este agendamento"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {abaAtiva === "garagem" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#E56B25]" />
                  Meus Dados
                </h3>
                <p className="text-xs text-zinc-400">
                  Mantenha seu contato atualizado para receber os avisos via WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSalvarPerfil} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#E56B25] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={agendamentoAtivo.cliente_telefone}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-sm text-zinc-500 cursor-not-allowed"
                  />
                  <span className="text-xs text-zinc-300 font-medium mt-1 block">
                    O telefone é sua chave única de acesso. Para alterar, consulte a estética.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#E56B25] transition-colors"
                  />
                </div>

                {msgPerfil && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      msgPerfil.tipo === "sucesso"
                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-900/50"
                        : "bg-red-950/40 text-red-300 border border-red-900/50"
                    }`}
                  >
                    {msgPerfil.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#c75517] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Dados
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#E56B25]" />
                    Minha Garagem ({veiculos.length})
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {veiculos.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white text-sm block">{v.modelo}</span>
                        <span className="text-zinc-400">
                          {v.marca ? `${v.marca} • ` : ""}Cor: {v.cor || "N/A"}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-zinc-900 font-mono font-bold text-zinc-200 border border-zinc-800">
                        {v.placa}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#E56B25]" />
                  Adicionar Outro Veículo à Garagem
                </h4>

                <form onSubmit={handleAdicionarVeiculo} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Modelo</label>
                      <input
                        type="text"
                        placeholder="Ex: BMW M3"
                        value={novoModelo}
                        onChange={(e) => setNovoModelo(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#E56B25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Marca</label>
                      <input
                        type="text"
                        placeholder="Ex: BMW"
                        value={novaMarca}
                        onChange={(e) => setNovaMarca(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#E56B25]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Placa</label>
                      <input
                        type="text"
                        placeholder="ABC-1234"
                        value={novaPlaca}
                        onChange={(e) => setNovaPlaca(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white uppercase focus:outline-none focus:border-[#E56B25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Cor</label>
                      <input
                        type="text"
                        placeholder="Preta"
                        value={novaCor}
                        onChange={(e) => setNovaCor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#E56B25]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Porte</label>
                      <select
                        value={novaCategoria}
                        onChange={(e) => setNovaCategoria(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#E56B25]"
                      >
                        <option value="pequeno">Hatch/Pequeno</option>
                        <option value="medio">Sedan/Médio</option>
                        <option value="grande">SUV/Grande</option>
                        <option value="moto">Motocicleta</option>
                      </select>
                    </div>
                  </div>

                  {msgVeiculo && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium ${
                        msgVeiculo.tipo === "sucesso"
                          ? "bg-emerald-950/40 text-emerald-300 border border-emerald-900/50"
                          : "bg-red-950/40 text-red-300 border border-red-900/50"
                      }`}
                    >
                      {msgVeiculo.texto}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Cadastrar Veículo
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
