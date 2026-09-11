"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/formatters";
import { aplicarMascaraTelefone, mascararTelefone, mascararEmail, detectarCanal } from "@/lib/utils/contato";
import { solicitarCodigoAction, validarCodigoAction } from "@/lib/actions/verificacao";
import { listarMeusAgendamentosAction, encerrarSessaoClienteAction } from "@/lib/actions/clientes";
import { buscarAgendamentoPublicoAction } from "@/lib/actions/agendamentos";
import { AcompanhamentoAgendamento } from "@/components/public/agendamentos/acompanhamento-agendamento";
import {
  Calendar,
  Clock,
  Car,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  LogOut,
  ExternalLink,
  Phone,
  Loader2
} from "lucide-react";

type Loja = {
  slug: string;
  nome: string;
  descricao?: string | null;
  endereco?: string | null;
  cor_primaria?: string | null;
  fuso_horario?: string | null;
};

type AgendamentoResumo = {
  id: string;
  data_hora: string;
  status: string;
  presenca_confirmada: boolean;
  servicos: { id: string; nome: string; preco: number | string }[];
  valor: number | string;
};

type Etapa = "identificar" | "codigo" | "lista";

type AgendamentoDetalhe = {
  id: string;
  data_hora: string;
  status: string;
  presenca_confirmada: boolean;
  cliente_nome: string;
  servicos: { id: string; nome: string; preco: number | string; duracaoMinutos: number }[];
  loja_nome: string;
  loja_slug: string;
  valor: number | string;
  cor_primaria?: string | null;
  fuso_horario?: string | null;
};

export function MeusAgendamentos({ loja }: { loja: Loja }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("identificar");
  const [contatoInput, setContatoInput] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [contatoMascarado, setContatoMascarado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [agendamentoDetalhe, setAgendamentoDetalhe] = useState<AgendamentoDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const corTema = loja.cor_primaria || "#E56B25";

  useEffect(() => {
    setEtapa("identificar");
    setAgendamentos([]);
    setPagina(1);
    setContatoInput("");
    setCodigoInput("");
    setContatoMascarado("");
    setErro(null);

    startTransition(async () => {
      const lista = await listarMeusAgendamentosAction(loja.slug);
      if (lista.sucesso && lista.dados && lista.dados.length > 0) {
        setAgendamentos(lista.dados);
        setEtapa("lista");
      } else {
        setEtapa("identificar");
      }
    });
  }, [loja.slug]);

  function handleMudarContato(valor: string) {
    if (valor.includes("@") || /[a-zA-Z]/.test(valor)) {
      setContatoInput(valor);
    } else {
      setContatoInput(aplicarMascaraTelefone(valor));
    }
  }

  function handleSolicitarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await solicitarCodigoAction(contatoInput);
        if (!resultado.sucesso) {
          setErro(resultado.erro || "Não foi possível enviar o código.");
          return;
        }

        setContatoMascarado(
          resultado.dados.canal === "whatsapp" 
            ? mascararTelefone(resultado.dados.contato) 
            : mascararEmail(resultado.dados.contato)
        );
        setEtapa("codigo");
        toast.success("Código enviado com sucesso!");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível enviar o código.");
      }
    });
  }

  function handleValidarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      try {
        const validacao = await validarCodigoAction(contatoInput, codigoInput, loja.slug);
        if (!validacao.sucesso) {
          setErro(validacao.erro || "Código inválido ou expirado.");
          return;
        }
        
        const lista = await listarMeusAgendamentosAction(loja.slug);
        if (lista.sucesso && lista.dados) {
          setAgendamentos(lista.dados);
          setEtapa("lista");
          toast.success("Acesso liberado com sucesso!");
        } else {
          setAgendamentos([]);
          setEtapa("lista");
          if (!lista.sucesso) toast.error(lista.erro);
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Código inválido ou expirado.");
      }
    });
  }

  async function abrirDetalhes(agendamentoId: string) {
    setAgendamentoDetalhe(null);
    setCarregandoDetalhe(true);
    try {
      const resposta = await buscarAgendamentoPublicoAction(agendamentoId);
      if (!resposta.sucesso || !resposta.dados) {
        throw new Error(!resposta.sucesso ? resposta.erro : "Falha ao carregar detalhes.");
      }
      setAgendamentoDetalhe(resposta.dados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível abrir os detalhes.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(agendamentos.length / pageSize));
  const paginaAgendamentos = useMemo(
    () => agendamentos.slice((pagina - 1) * pageSize, pagina * pageSize),
    [agendamentos, pagina]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-[#E56B25] selection:text-white">
      {/* Header com identidade da loja e Trimo */}
      <header className="w-full border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href={`/${loja.slug}`} className="flex items-center gap-3 group">
            <div
              style={{ backgroundColor: corTema }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md shadow-[#E56B25]/20 group-hover:scale-105 transition-transform"
            >
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 block font-medium">Estética Automotiva</span>
              <span className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] block">
                {loja.nome}
              </span>
            </div>
          </Link>

          {etapa === "lista" && (
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  await encerrarSessaoClienteAction(loja.slug);
                  setEtapa("identificar");
                  setAgendamentos([]);
                  setPagina(1);
                  setContatoInput("");
                  setCodigoInput("");
                  setContatoMascarado("");
                  setErro(null);
                  toast.success("Sessão encerrada com sucesso.");
                  router.refresh();
                });
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10 md:py-16 flex flex-col justify-center">
        {etapa !== "lista" && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Meus Agendamentos
            </h1>
            <p className="text-sm text-zinc-400">
              Digite seu WhatsApp ou e-mail para acessar o histórico da sua conta.
            </p>
          </div>
        )}

        {/* ETAPA 1: Identificar */}
        {etapa === "identificar" && (
          <form
            onSubmit={handleSolicitarCodigo}
            className="space-y-5 bg-zinc-900/60 border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-sm"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#E56B25]" />
                WhatsApp ou E-mail
              </label>
              <input
                value={contatoInput}
                onChange={(e) => handleMudarContato(e.target.value)}
                required
                placeholder="(11) 99999-9999 ou seu@email.com"
                className="w-full h-12 px-4 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 outline-none focus:border-[#E56B25] transition-all text-sm"
              />
              <span className="text-xs text-zinc-400 font-medium block">
                Você receberá um código temporário de verificação.
              </span>
            </div>

            {erro && (
              <p className="text-xs text-red-400 bg-red-950/40 py-2.5 px-3.5 rounded-xl border border-red-900/50">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || contatoInput.length < 5}
              style={{ backgroundColor: corTema }}
              className="w-full h-12 rounded-xl font-bold text-white text-sm hover:opacity-95 transition-all disabled:opacity-50 shadow-lg shadow-[#E56B25]/20 flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Enviando código..." : "Receber Código de Acesso"}
            </button>
          </form>
        )}

        {/* ETAPA 2: Código */}
        {etapa === "codigo" && (
          <form
            onSubmit={handleValidarCodigo}
            className="space-y-5 bg-zinc-900/60 border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl backdrop-blur-sm"
          >
            <div className="text-center mb-2">
              <p className="text-xs text-zinc-400">Enviamos um código de segurança para</p>
              <p className="text-sm font-bold text-white mt-0.5">{contatoMascarado}</p>
            </div>

            <div className="space-y-2">
              <input
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="w-full h-14 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-center text-3xl font-mono tracking-[0.25em] placeholder:text-zinc-700 outline-none focus:border-[#E56B25] transition-all"
              />
            </div>

            {erro && (
              <p className="text-xs text-red-400 bg-red-950/40 py-2.5 px-3.5 rounded-xl border border-red-900/50">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || codigoInput.length < 6}
              style={{ backgroundColor: corTema }}
              className="w-full h-12 rounded-xl font-bold text-white text-sm hover:opacity-95 transition-all disabled:opacity-50 shadow-lg shadow-[#E56B25]/20 flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Validando..." : "Entrar no Painel"}
            </button>

            <button
              type="button"
              onClick={() => {
                setEtapa("identificar");
                setCodigoInput("");
                setErro(null);
              }}
              className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Corrigir contato / reenviar
            </button>
          </form>
        )}

        {/* ETAPA 3: Lista de Agendamentos */}
        {etapa === "lista" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Meus Agendamentos</h2>
                <p className="text-xs text-zinc-400">Clique em qualquer serviço para ver o status em tempo real.</p>
              </div>
              <Link
                href={`/${loja.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E56B25] hover:text-[#c75517] transition-colors"
              >
                Agendar outro
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {agendamentos.length === 0 ? (
                <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl py-12 px-6 text-center">
                  <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-300 mb-1">Nenhum agendamento encontrado</p>
                  <p className="text-xs text-zinc-500 mb-4">Você ainda não tem serviços agendados nesta estética.</p>
                  <Link
                    href={`/${loja.slug}`}
                    style={{ backgroundColor: corTema }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md shadow-[#E56B25]/20"
                  >
                    Agendar primeiro serviço
                  </Link>
                </div>
              ) : (
                paginaAgendamentos.map((a) => (
                  <div
                    key={a.id}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge status={a.status} />
                      <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#E56B25]" />
                        {new Date(a.data_hora).toLocaleDateString("pt-BR", {
                          timeZone: loja.fuso_horario || "America/Sao_Paulo",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate mb-1">
                          {a.servicos.map((s) => s.nome).join(" • ")}
                        </p>
                        <p className="text-sm font-extrabold text-[#E56B25]">
                          {formatarMoeda(Number(a.valor))}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/acompanhar/${a.id}`}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5"
                          title="Abrir Portal Completo do Carro"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#E56B25]" />
                          Portal
                        </Link>
                        <button
                          type="button"
                          onClick={() => void abrirDetalhes(a.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Detalhes Rápidos"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-zinc-400">
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.max(1, current - 1))}
                  disabled={pagina === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <span className="text-zinc-400 font-medium text-xs">
                  Página {pagina} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.min(totalPages, current + 1))}
                  disabled={pagina === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Próxima
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        aberto={Boolean(agendamentoDetalhe || carregandoDetalhe)}
        onFechar={() => {
          setAgendamentoDetalhe(null);
          setCarregandoDetalhe(false);
        }}
        titulo="Detalhes do Agendamento"
        maxWidth="max-w-md"
      >
        {carregandoDetalhe ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 text-[#E56B25] animate-spin" />
            <p className="text-xs font-semibold text-zinc-400">Carregando detalhes do agendamento...</p>
          </div>
        ) : agendamentoDetalhe ? (
          <AcompanhamentoAgendamento
            agendamento={agendamentoDetalhe}
            modo="modal"
            onFechar={() => {
              setAgendamentoDetalhe(null);
              setCarregandoDetalhe(false);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
