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
  nome_dono?: string | null;
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
  servicos: { id: string; nome: string; preco: string }[];
};

type Etapa = "identificar" | "codigo" | "lista";

type AgendamentoDetalhe = {
  id: string;
  data_hora: string;
  status: string;
  presenca_confirmada: boolean;
  cliente_nome: string;
  servicos: { id: string; nome: string; preco: number; duracaoMinutos: number }[];
  loja_nome: string;
  loja_slug: string;
  valor: string;
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

  const canal = detectarCanal(contatoInput);

  useEffect(() => {
    setEtapa("identificar");
    setAgendamentos([]);
    setPagina(1);
    setContatoInput("");
    setCodigoInput("");
    setContatoMascarado("");
    setErro(null);

    startTransition(async () => {
      try {
        const lista = await listarMeusAgendamentosAction(loja.slug);
        if (lista.length > 0) {
          setAgendamentos(lista);
          setEtapa("lista");
        }
      } catch (err) {
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
        setContatoMascarado(
          resultado.canal === "whatsapp" ? mascararTelefone(resultado.contato) : mascararEmail(resultado.contato)
        );
        setEtapa("codigo");
        toast.success("Código enviado!");
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
        await validarCodigoAction(contatoInput, codigoInput, loja.slug);
        const lista = await listarMeusAgendamentosAction(loja.slug);
        setAgendamentos(lista);
        setEtapa("lista");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Código inválido.");
      }
    });
  }

  async function abrirDetalhes(agendamentoId: string) {
    setAgendamentoDetalhe(null);
    setCarregandoDetalhe(true);
    try {
      const resposta = await buscarAgendamentoPublicoAction(agendamentoId);
      if (!resposta.sucesso) throw new Error(resposta.erro);
      setAgendamentoDetalhe(resposta.dados as AgendamentoDetalhe);
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header Minimalista */}
      <div className="w-full border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                    toast.success("Sessão encerrada. Insira seu código novamente.");
                    router.refresh();
                  });
                }}
                className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Sair
              </button>
            )}
          </div>
          <span className="text-sm font-bold text-white truncate max-w-[200px]">{loja.nome}</span>
        </div>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-12">

        {etapa !== "lista" && (
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-zinc-900 border border-zinc-800">
              <svg className="w-8 h-8 text-zinc-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Meus Agendamentos</h1>
            <p className="text-sm text-zinc-400 mt-2">Acompanhe os serviços e o histórico da loja.</p>
          </div>
        )}

        {etapa === "identificar" && (
          <form onSubmit={handleSolicitarCodigo} className="space-y-6 animate-in fade-in">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                WhatsApp ou E-mail
              </label>
              <input
                value={contatoInput}
                onChange={(e) => handleMudarContato(e.target.value)}
                required
                placeholder="(11) 99999-9999"
                className="w-full h-14 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-600 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-base"
              />
            </div>
            {erro && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{erro}</p>}
            <button 
              type="submit" 
              disabled={pending || contatoInput.length < 5} 
              className="w-full h-14 rounded-xl font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50"
            >
              {pending ? "Enviando..." : "Receber código de acesso"}
            </button>
          </form>
        )}

        {etapa === "codigo" && (
          <form onSubmit={handleValidarCodigo} className="space-y-6 animate-in fade-in">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-sm text-zinc-300">
                Código de 6 dígitos enviado para <br/>
                <strong className="text-white text-base mt-1 block">{contatoMascarado}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-center block">
                Digite o código
              </label>
              <input
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="w-full h-16 rounded-xl border border-zinc-800 bg-zinc-900/50 text-white text-center text-3xl font-mono tracking-[0.5em] placeholder:text-zinc-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
            </div>
            {erro && <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{erro}</p>}

            <button 
              type="submit" 
              disabled={pending || codigoInput.length < 6} 
              className="w-full h-14 rounded-xl font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50"
            >
              {pending ? "Validando..." : "Acessar agendamentos"}
            </button>
          </form>
        )}

        {etapa === "lista" && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 mb-2">Loja</p>
              <h2 className="text-lg font-bold text-white">{loja.nome}</h2>
              {loja.descricao && <p className="text-sm text-zinc-400 mt-2">{loja.descricao}</p>}
              <div className="mt-4 grid gap-2 text-sm text-zinc-400">
                {loja.nome_dono && <p><span className="font-semibold text-zinc-200">Responsável:</span> {loja.nome_dono}</p>}
                {loja.endereco && <p><span className="font-semibold text-zinc-200">Endereço:</span> {loja.endereco}</p>}
                <p>
                  <span className="font-semibold text-zinc-200">Acesso:</span>{" "}
                  <a href={`/${loja.slug}`} className="text-sky-300 hover:text-sky-200 transition-colors">
                    Página da loja
                  </a>
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Histórico de serviços</h3>

            <div className="space-y-4">
              {agendamentos.length === 0 ? (
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl py-16 px-6 text-center">
                  <p className="text-sm text-zinc-500">Nenhum agendamento encontrado nessa loja.</p>
                </div>
              ) : (
                paginaAgendamentos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => void abrirDetalhes(a.id)}
                    className="w-full text-left bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/60">
                      <StatusBadge status={a.status} />
                      <span className="text-xs font-semibold text-zinc-400 capitalize">
                        {new Date(a.data_hora).toLocaleDateString("pt-BR", { timeZone: loja.fuso_horario || 'America/Sao_Paulo', day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-white truncate mb-1">
                          {a.servicos.map((s) => s.nome).join(" + ")}
                        </p>
                        <p className="text-sm font-mono text-zinc-300 font-semibold">
                          {formatarMoeda(a.servicos.reduce((soma, s) => soma + Number(s.preco), 0).toFixed(2))}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white transition-colors shrink-0">
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
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-400">
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.max(1, current - 1))}
                  disabled={pagina === 1}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>
                  Página {pagina} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((current) => Math.min(totalPages, current + 1))}
                  disabled={pagina === totalPages}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        aberto={Boolean(agendamentoDetalhe || carregandoDetalhe)}
        onFechar={() => {
          setAgendamentoDetalhe(null);
          setCarregandoDetalhe(false);
        }}
        titulo="Detalhes do agendamento"
        maxWidth="max-w-md"
      >
        {carregandoDetalhe ? (
          <p className="text-sm text-zinc-400">Carregando detalhes...</p>
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