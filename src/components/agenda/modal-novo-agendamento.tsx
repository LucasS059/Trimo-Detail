"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InputHora } from "@/components/ui/input-hora";
import { toast } from "sonner";
import { criarHandlerTelefone, normalizarTelefone, aplicarMascaraTelefone } from "@/lib/utils/contato";
import {
  UserCheck,
  UserPlus,
  Search,
  Phone,
  X,
  Check,
} from "lucide-react";

// Actions do backend
import { criarAgendamentoPeloAdmin } from "@/lib/actions/agendamentos";
import { buscarClientesAutocompleteAction } from "@/lib/actions/clientes";

type ServicoResultado = { id: string; nome: string; preco: number | string; duracao_minutos: number };
type ClienteBuscado = { id: string; nome: string; telefone: string; email?: string | null };

const campo = {
  label: "text-sm font-bold text-zinc-300",
  input:
    "h-10 px-3 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full text-xs sm:text-sm",
};

export function ModalNovoAgendamento({ servicos }: { servicos: ServicoResultado[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Serviços
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoResultado[]>([]);

  // Abas de seleção de cliente: "cadastrado" ou "novo"
  const [modoCliente, setModoCliente] = useState<"cadastrado" | "novo">("cadastrado");

  // Estados do Cliente Cadastrado
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ClienteBuscado[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBuscado | null>(null);

  // Estados para Novo Cliente
  const [clienteNomeNovo, setClienteNomeNovo] = useState("");
  const [clienteTelefoneNovo, setClienteTelefoneNovo] = useState("");
  const [clienteEmailNovo, setClienteEmailNovo] = useState("");

  const handleTelefoneNovoChange = criarHandlerTelefone(setClienteTelefoneNovo);

  // Carregar lista de clientes (com termo ou os mais recentes quando vazio)
  const carregarClientes = useCallback(async (termo: string) => {
    setBuscando(true);
    try {
      const res = await buscarClientesAutocompleteAction(termo);
      setResultadosBusca(res as ClienteBuscado[]);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    } finally {
      setBuscando(false);
    }
  }, []);

  // Quando abre o modal e está no modo "cadastrado", carrega a lista inicial
  useEffect(() => {
    if (isOpen && modoCliente === "cadastrado" && !clienteSelecionado) {
      carregarClientes(busca);
    }
  }, [isOpen, modoCliente, clienteSelecionado, carregarClientes]);

  // Debounce para busca enquanto digita
  useEffect(() => {
    if (!isOpen || modoCliente !== "cadastrado" || clienteSelecionado) return;

    const timer = setTimeout(() => {
      carregarClientes(busca);
    }, 350);

    return () => clearTimeout(timer);
  }, [busca, isOpen, modoCliente, clienteSelecionado, carregarClientes]);

  function toggleServico(servico: ServicoResultado) {
    setServicosSelecionados((prev) =>
      prev.find((s) => s.id === servico.id)
        ? prev.filter((s) => s.id !== servico.id)
        : [...prev, servico]
    );
  }

  function fecharModal() {
    setIsOpen(false);
    setTimeout(() => {
      setServicosSelecionados([]);
      setBusca("");
      setResultadosBusca([]);
      setClienteSelecionado(null);
      setClienteNomeNovo("");
      setClienteTelefoneNovo("");
      setClienteEmailNovo("");
      setModoCliente("cadastrado");
      formRef.current?.reset();
    }, 200);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (servicosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um serviço.");
      return;
    }

    // Valida e preenche cliente de acordo com a aba selecionada
    if (modoCliente === "cadastrado") {
      if (!clienteSelecionado) {
        toast.error("Selecione um cliente da lista ou mude para a aba 'Novo Cliente'.");
        return;
      }
      formData.set("clienteId", clienteSelecionado.id);
      formData.set("clienteNome", clienteSelecionado.nome);
      formData.set("clienteTelefone", clienteSelecionado.telefone);
      if (clienteSelecionado.email) {
        formData.set("clienteEmail", clienteSelecionado.email);
      }
    } else {
      if (!clienteNomeNovo.trim() || !clienteTelefoneNovo.trim()) {
        toast.error("Preencha o nome e o WhatsApp do novo cliente.");
        return;
      }
      formData.set("clienteNome", clienteNomeNovo.trim());
      formData.set("clienteTelefone", normalizarTelefone(clienteTelefoneNovo));
      if (clienteEmailNovo.trim()) {
        formData.set("clienteEmail", clienteEmailNovo.trim());
      }
    }

    // Adiciona os serviços no formData
    servicosSelecionados.forEach((s) => formData.append("servicosIds", s.id));

    startTransition(async () => {
      try {
        const resultado = await criarAgendamentoPeloAdmin(formData);
        if (resultado && !resultado.sucesso) {
          toast.error(resultado.erro);
          return;
        }

        toast.success("Agendamento criado com sucesso!");
        fecharModal();
      } catch (error: any) {
        toast.error(error.message || "Erro ao criar o agendamento.");
      }
    });
  }

  const totalPreco = servicosSelecionados.reduce((acc, s) => acc + Number(s.preco), 0);
  const totalDuracao = servicosSelecionados.reduce((acc, s) => acc + s.duracao_minutos, 0);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Novo Agendamento</Button>

      <Modal aberto={isOpen} onFechar={fecharModal} titulo="Novo Agendamento" maxWidth="max-w-xl">
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          
          {/* SELEÇÃO DO CLIENTE */}
          <div className="flex flex-col gap-3 p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className={campo.label}>Cliente</label>
              <span className="text-xs text-zinc-400">Identificação para contato e WhatsApp</span>
            </div>

            {/* Alternador de Abas: Cliente Já Cadastrado vs Novo Cliente */}
            <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setModoCliente("cadastrado");
                  if (!resultadosBusca.length) carregarClientes(busca);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modoCliente === "cadastrado"
                    ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#E56B25]" />
                Já Cadastrado
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoCliente("novo");
                  setClienteSelecionado(null);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modoCliente === "novo"
                    ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E56B25]" />
                Novo Cliente (Sem Registro)
              </button>
            </div>

            {/* ABA 1: CLIENTE CADASTRADO */}
            {modoCliente === "cadastrado" && (
              <div className="space-y-3">
                {clienteSelecionado ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{clienteSelecionado.nome}</p>
                        <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {aplicarMascaraTelefone(clienteSelecionado.telefone)}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setClienteSelecionado(null)} 
                      className="text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Barra de Busca com Botão de Ação */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Digite o nome ou número do WhatsApp..."
                          value={busca}
                          onChange={(e) => setBusca(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              carregarClientes(busca);
                            }
                          }}
                          className={`${campo.input} pl-9 pr-8`}
                          autoComplete="off"
                        />
                        {busca && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusca("");
                              carregarClientes("");
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => carregarClientes(busca)}
                        disabled={buscando}
                        className="h-10 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-[#E56B25]" />
                        Buscar
                      </button>
                    </div>

                    {/* Lista de Resultados / Clientes Recentes */}
                    {buscando ? (
                      <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-900/60 rounded-xl border border-zinc-800">
                        Buscando clientes no banco de dados...
                      </div>
                    ) : resultadosBusca.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block px-1">
                          {busca.trim() ? "Resultados encontrados:" : "Clientes recentes:"}
                        </span>
                        {resultadosBusca.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setClienteSelecionado(c);
                              setBusca("");
                            }}
                            className="w-full text-left px-3.5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <p className="font-semibold text-white text-xs sm:text-sm">{c.nome}</p>
                              <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-zinc-500" />
                                  {aplicarMascaraTelefone(c.telefone)}
                                </span>
                                {c.email && (
                                  <span className="text-zinc-500 text-[11px] truncate max-w-[170px]">
                                    {c.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#E56B25] group-hover:text-white bg-[#E56B25]/10 group-hover:bg-[#E56B25] px-2.5 py-1 rounded-lg transition-colors">
                              Selecionar
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                        <p className="text-xs text-zinc-300 font-medium">
                          Nenhum cliente cadastrado encontrado com esses dados.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setModoCliente("novo");
                            if (busca.trim()) {
                              if (/^\d+$/.test(busca.replace(/\D/g, ""))) {
                                setClienteTelefoneNovo(busca);
                              } else if (busca.includes("@")) {
                                setClienteEmailNovo(busca);
                              } else {
                                setClienteNomeNovo(busca);
                              }
                            }
                          }}
                          className="text-xs font-bold text-[#E56B25] hover:underline cursor-pointer"
                        >
                          + Cadastrar como novo cliente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: NOVO CLIENTE (SEM REGISTRO) */}
            {modoCliente === "novo" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      placeholder="Nome do cliente" 
                      value={clienteNomeNovo}
                      onChange={(e) => setClienteNomeNovo(e.target.value)}
                      className={campo.input} 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">WhatsApp / Celular</label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={clienteTelefoneNovo}
                      onChange={handleTelefoneNovoChange}
                      inputMode="numeric"
                      maxLength={16}
                      className={campo.input}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">E-mail (Opcional)</label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={clienteEmailNovo}
                      onChange={(e) => setClienteEmailNovo(e.target.value)}
                      className={campo.input}
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium px-1">
                  O cliente será cadastrado na hora e receberá as notificações automáticas por WhatsApp.
                </p>
              </div>
            )}
          </div>

          {/* SESSÃO DE SERVIÇOS */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={campo.label}>Serviços</label>
              <span className="text-xs text-zinc-400">Selecione um ou mais</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {servicos.map((s) => {
                const selecionado = servicosSelecionados.some((selec) => selec.id === s.id);
                return (
                  <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selecionado ? 'bg-[#E56B25]/10 border-[#E56B25]/50' : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-900'}`}>
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => toggleServico(s)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#E56B25] focus:ring-[#E56B25]"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm text-white font-semibold truncate">{s.nome}</span>
                      <span className="text-xs text-zinc-300 font-medium">R$ {Number(s.preco).toFixed(2).replace(".", ",")} • {s.duracao_minutos}min</span>
                    </div>
                  </label>
                );
              })}
            </div>
            
            {servicosSelecionados.length > 0 && (
              <div className="flex items-center justify-between mt-1 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-xs text-zinc-300 font-medium">Total estimado ({totalDuracao} min)</span>
                <span className="font-black text-white text-base">R$ {totalPreco.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
          </div>

          {/* SESSÃO DE DATA E HORA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl">
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Data</label>
              <input required name="data" type="date" className={`${campo.input} [color-scheme:dark]`} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Hora de Início</label>
              <InputHora name="hora" required className={campo.input} />
            </div>
          </div>

          {/* SESSÃO DE OBSERVAÇÕES */}
          <div className="flex flex-col gap-1.5">
            <label className={campo.label}>Observações / Detalhes (Opcional)</label>
            <textarea
              name="observacoes"
              placeholder="Ex: Foco nos bancos de couro, arranhão na porta esquerda, etc."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-xs sm:text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="secondary" type="button" onClick={fecharModal} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || servicosSelecionados.length === 0}>
              {pending ? "A gravar..." : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}