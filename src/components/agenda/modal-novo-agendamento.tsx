"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InputHora } from "@/components/ui/input-hora";
import { toast } from "sonner";
import { criarHandlerTelefone, normalizarTelefone } from "@/lib/utils/contato";

// Actions do seu backend
import { criarAgendamentoPeloAdmin } from "@/lib/actions/agendamentos";
import { buscarClientesAutocompleteAction } from "@/lib/actions/clientes";

type ServicoResultado = { id: string; nome: string; preco: number | string; duracao_minutos: number };
type ClienteBuscado = { id: string; nome: string; telefone: string };

const campo = {
  label: "text-sm font-bold text-zinc-300",
  input:
    "h-10 px-3 rounded-lg border border-zinc-600 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full",
};

export function ModalNovoAgendamento({ servicos }: { servicos: ServicoResultado[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Estados dos Serviços
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoResultado[]>([]);
  
  // Estados da Busca Inteligente
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ClienteBuscado[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBuscado | null>(null);

  // Estados para Novo Cliente (Fallback)
  const [clienteNomeNovo, setClienteNomeNovo] = useState("");
  const [clienteTelefoneNovo, setClienteTelefoneNovo] = useState("");

  const handleTelefoneNovoChange = criarHandlerTelefone(setClienteTelefoneNovo);

  // Efeito de Debounce para buscar no banco enquanto digita
  useEffect(() => {
    if (busca.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        // Chamada real para a sua action de clientes
        const resultados = await buscarClientesAutocompleteAction(busca);
        setResultadosBusca(resultados);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

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

    if (!clienteSelecionado && (!clienteNomeNovo.trim() || !clienteTelefoneNovo.trim())) {
      toast.error("Selecione um cliente existente ou preencha os dados do novo cliente.");
      return;
    }

    // Gerencia os dados do cliente (Existente vs Novo)
    if (clienteSelecionado) {
      formData.set("clienteId", clienteSelecionado.id);
      formData.set("clienteNome", clienteSelecionado.nome);
      formData.set("clienteTelefone", clienteSelecionado.telefone);
    } else {
      formData.set("clienteNome", clienteNomeNovo);
      formData.set("clienteTelefone", normalizarTelefone(clienteTelefoneNovo));
    }

    // Adiciona os serviços no formData
    servicosSelecionados.forEach((s) => formData.append("servicosIds", s.id));

    startTransition(async () => {
      try {
        const resultado = await criarAgendamentoPeloAdmin(formData);
        
        // Verifica se a action retornou um erro estruturado
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
          
          {/* SESSÃO DO CLIENTE: Inteligência de Busca */}
          <div className="flex flex-col gap-3 p-4 bg-zinc-900/40 border border-zinc-700/50 rounded-xl">
            <label className={campo.label}>Cliente</label>

            {clienteSelecionado ? (
              <div className="flex items-center justify-between p-3 bg-[#E56B25]/10 border border-[#E56B25]/50 rounded-lg animate-in fade-in">
                <div>
                  <p className="text-sm font-bold text-white">{clienteSelecionado.nome}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{clienteSelecionado.telefone}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{clienteSelecionado.telefone}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setClienteSelecionado(null)} 
                  className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente (Nome ou WhatsApp)..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className={campo.input}
                    autoComplete="off"
                  />
                  
                  {/* Dropdown de Resultados */}
                  {busca.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {buscando ? (
                        <div className="p-3 text-center text-xs text-zinc-400">Buscando...</div>
                      ) : resultadosBusca.length > 0 ? (
                        <ul className="flex flex-col">
                          {resultadosBusca.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setClienteSelecionado(c);
                                  setBusca("");
                                  setResultadosBusca([]);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors flex items-center justify-between border-b border-zinc-700/50 last:border-0"
                              >
                                <span className="font-semibold text-white text-sm">{c.nome}</span>
                                <span className="text-xs text-zinc-400 font-mono">{c.telefone}</span>
                                <span className="text-xs text-zinc-400 font-medium">{c.telefone}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-3 text-center text-xs text-zinc-400">
                          Nenhum cliente encontrado. Preencha abaixo para cadastrar.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800"></div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ou cadastre novo</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nome do cliente" 
                    value={clienteNomeNovo}
                    onChange={(e) => setClienteNomeNovo(e.target.value)}
                    className={campo.input} 
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    value={clienteTelefoneNovo}
                    onChange={handleTelefoneNovoChange}
                    inputMode="numeric"
                    maxLength={16}
                    className={campo.input}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SESSÃO DE SERVIÇOS */}
          <div className="flex flex-col gap-2">
            <label className={campo.label}>Serviços</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {servicos.map((s) => {
                const selecionado = servicosSelecionados.some((selec) => selec.id === s.id);
                return (
                  <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selecionado ? 'bg-[#E56B25]/10 border-[#E56B25]/50' : 'bg-zinc-900 border-zinc-700/50 hover:bg-zinc-800'}`}>
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => toggleServico(s)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-[#E56B25] focus:ring-[#E56B25]"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-white font-medium truncate">{s.nome}</span>
                      <span className="text-xs text-zinc-400">R$ {Number(s.preco).toFixed(2).replace(".", ",")}</span>
                    </div>
                  </label>
                )
              })}
            </div>
            
            {servicosSelecionados.length > 0 && (
              <div className="flex items-center justify-between mt-1 text-sm px-1">
                <span className="text-zinc-400">Total ({totalDuracao} min)</span>
                <span className="font-bold text-white text-base">R$ {totalPreco.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
          </div>

          {/* SESSÃO DE DATA E HORA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-700/50 p-4 rounded-xl">
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Data</label>
              <input required name="data" type="date" className={`${campo.input} [color-scheme:dark]`} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Hora</label>
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
              className="w-full px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 mt-2">
            <Button variant="secondary" type="button" onClick={fecharModal} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || servicosSelecionados.length === 0}>
              {pending ? "A gravar..." : "Agendar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}