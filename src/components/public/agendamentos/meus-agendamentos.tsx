"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { formatarMoeda } from "@/lib/formatters";
import { aplicarMascaraTelefone, mascararTelefone, mascararEmail, detectarCanal } from "@/lib/utils/contato";
import { solicitarCodigoAction, validarCodigoAction } from "@/lib/actions/verificacao";
import { listarMeusAgendamentosAction, encerrarSessaoClienteAction } from "@/lib/actions/clientes";
import { buscarAgendamentoPublicoAction } from "@/lib/actions/agendamentos";
import { AcompanhamentoAgendamento } from "@/components/public/agendamentos/acompanhamento-agendamento";

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
        
        // Tratamento da ActionResponse
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
        
        // Tratamento da ActionResponse
        if (!validacao.sucesso) {
           setErro(validacao.erro || "Código inválido ou expirado.");
           return;
        }
        
        const lista = await listarMeusAgendamentosAction(loja.slug);
        if (lista.sucesso && lista.dados) {
          setAgendamentos(lista.dados);
          setEtapa("lista");
          toast.success("Acesso liberado!");
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800">
      {/* Header Minimalista Glassmorphism */}
      <header className="w-full border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-white/10 shadow-inner">
               <span className="text-xs font-black text-white">{loja.nome.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{loja.nome}</span>
          </div>
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
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 md:py-16 flex flex-col justify-center">
        
        {etapa !== "lista" && (
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Meus Agendamentos</h1>
            <p className="text-sm text-zinc-400">Acesse seu histórico e detalhes dos serviços.</p>
          </div>
        )}

        {etapa === "identificar" && (
          <form onSubmit={handleSolicitarCodigo} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                Acesso Seguro (WhatsApp ou E-mail)
              </label>
              <input
                value={contatoInput}
                onChange={(e) => handleMudarContato(e.target.value)}
                required
                placeholder="(11) 99999-9999 ou seu@email.com"
                className="w-full h-14 px-5 rounded-2xl border border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-base shadow-sm"
              />
            </div>
            {erro && <p className="text-sm text-red-400 bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">{erro}</p>}
            <button 
              type="submit" 
              disabled={pending || contatoInput.length < 5} 
              className="w-full h-14 rounded-2xl font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:hover:bg-white shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              {pending ? "Enviando..." : "Receber código"}
            </button>
          </form>
        )}

        {etapa === "codigo" && (
          <form onSubmit={handleValidarCodigo} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <p className="text-sm text-zinc-400">Enviamos um código para</p>
              <p className="text-base font-medium text-white mt-1">{contatoMascarado}</p>
            </div>

            <div className="space-y-1.5">
              <input
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                className="w-full h-16 rounded-2xl border border-white/10 bg-zinc-900/50 text-white text-center text-4xl font-mono tracking-[0.3em] placeholder:text-zinc-700 outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all shadow-sm"
              />
            </div>
            {erro && <p className="text-sm text-red-400 bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20">{erro}</p>}

            <button 
              type="submit" 
              disabled={pending || codigoInput.length < 6} 
              className="w-full h-14 rounded-2xl font-semibold text-zinc-950 bg-white hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              {pending ? "Validando..." : "Acessar agendamentos"}
            </button>
            <button 
              type="button" 
              onClick={() => { setEtapa("identificar"); setCodigoInput(""); setErro(null); }}
              className="w-full h-12 rounded-2xl font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Tentar outro contato
            </button>
          </form>
        )}

        {etapa === "lista" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-white">Histórico</h3>
               <a href={`/${loja.slug}`} className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                  Ver serviços da loja →
               </a>
            </div>

            <div className="space-y-3">
              {agendamentos.length === 0 ? (
                <div className="bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl py-12 px-6 text-center">
                  <p className="text-sm text-zinc-500">Você ainda não possui agendamentos nesta loja.</p>
                </div>
              ) : (
                paginaAgendamentos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void abrirDetalhes(a.id)}
                    className="w-full text-left bg-zinc-900/40 border border-white/5 rounded-3xl p-5 hover:bg-zinc-900/80 hover:border-white/10 transition-all group active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <StatusBadge status={a.status} />
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
                        {new Date(a.data_hora).toLocaleDateString("pt-BR", { 
                          timeZone: loja.fuso_horario || 'America/Sao_Paulo', 
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" 
                        }).replace(" de ", "/").replace(":", "h")}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-200 truncate mb-1">
                          {a.servicos.map((s) => s.nome).join(" • ")}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {formatarMoeda(a.valor)}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-zinc-950 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.max(1, current - 1))}
                  disabled={pagina === 1}
                  className="font-medium text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-zinc-600 font-medium">
                  {pagina} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.min(totalPages, current + 1))}
                  disabled={pagina === totalPages}
                  className="font-medium text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Próxima →
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
        titulo="Detalhes da Reserva"
        maxWidth="max-w-md"
      >
        {carregandoDetalhe ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
             <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
             <p className="text-sm font-medium text-zinc-400">Carregando informações...</p>
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