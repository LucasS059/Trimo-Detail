"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Cliente } from "./clientes-lista";
import { criarVeiculoAction, deletarVeiculoAction } from "@/lib/actions/veiculos";
import { deletarClienteAction, obterHistoricoClienteAction } from "@/lib/actions/clientes";
import { gerarLinkWhatsApp } from "@/lib/utils/whatsapp-link";
import { ModalClienteForm } from "./modal-cliente-form";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, User, Car, Calendar, Plus, Trash2, Edit2 } from "lucide-react";

type HistoricoDados = {
  totalGasto: number;
  totalConcluidos: number;
  totalAtivos: number;
  totalCancelados: number;
  totalNaoCompareceu: number;
  ticketMedio: number;
  agendamentos: Array<{
    id: string;
    codigo: number;
    data_hora: string;
    valor: number | string;
    status: string;
    observacoes: string | null;
    veiculo_modelo: string | null;
    veiculo_placa: string | null;
    servicos: Array<{ nome: string; preco: number | string }>;
  }>;
};

// Ícone SVG limpo e oficial do WhatsApp (sem emojis e de alta fidelidade)
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.188 8.188 0 0 1-5.82 2.42c-1.44 0-2.86-.38-4.12-1.1l-.3-.18-3.12.82.83-3.04-.19-.31a8.17 8.17 0 0 1-1.25-4.43c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
    </svg>
  );
}

export function ModalClienteDetalhes({
  cliente,
  onFechar,
  onAtualizado,
}: {
  cliente: Cliente;
  onFechar: () => void;
  onAtualizado: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"historico" | "veiculos">("historico");
  
  const [historico, setHistorico] = useState<HistoricoDados | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  useEffect(() => {
    if (cliente?.id) {
      setCarregandoHistorico(true);
      obterHistoricoClienteAction(cliente.id)
        .then((res) => {
          if (res.sucesso && res.dados) {
            setHistorico(res.dados);
          }
        })
        .catch((err) => console.error("Erro ao carregar histórico do cliente:", err))
        .finally(() => setCarregandoHistorico(false));
    }
  }, [cliente.id]);
  
  // Modais de confirmação
  const [veiculoParaRemover, setVeiculoParaRemover] = useState<string | null>(null);
  const [confirmandoExclusaoCliente, setConfirmandoExclusaoCliente] = useState(false);
  
  // Cadastro de veículo
  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [veiculoCor, setVeiculoCor] = useState("");

  const [paginaVeiculos, setPaginaVeiculos] = useState(1);
  const veiculosPorPagina = 4;
  
  const totalVeiculos = cliente.veiculos?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalVeiculos / veiculosPorPagina));
  const paginaAtual = Math.min(paginaVeiculos, totalPaginas);
  const startIndex = (paginaAtual - 1) * veiculosPorPagina;
  const veiculosVisiveis = cliente.veiculos?.slice(startIndex, startIndex + veiculosPorPagina) || [];

  const inputClass = "h-9 px-3 rounded border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] transition-colors text-sm";

  function handleAdicionarVeiculo(e: React.FormEvent) {
    e.preventDefault();
    if (!veiculoModelo.trim()) {
      toast.warning("Informe o modelo do veículo.");
      return;
    }
    startTransition(async () => {
      const res = await criarVeiculoAction(cliente.id, {
        modelo: veiculoModelo.trim(),
        placa: veiculoPlaca.trim() || undefined,
        cor: veiculoCor.trim() || undefined,
      });

      if (res.sucesso) {
        setVeiculoModelo("");
        setVeiculoPlaca("");
        setVeiculoCor("");
        const novaPaginacao = Math.ceil((totalVeiculos + 1) / veiculosPorPagina);
        setPaginaVeiculos(novaPaginacao);
        toast.success("Veículo adicionado à garagem!");
        onAtualizado();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function pedirExclusaoVeiculo(veiculoId: string) {
    setVeiculoParaRemover(veiculoId);
  }

  function confirmarExclusaoVeiculo() {
    if (!veiculoParaRemover) return;
    startTransition(async () => {
      const res = await deletarVeiculoAction(veiculoParaRemover);
      if (res.sucesso) {
        toast.success("Veículo removido com sucesso.");
        setVeiculoParaRemover(null);
        setPaginaVeiculos((p) => Math.max(1, Math.min(p, Math.ceil((totalVeiculos - 1) / veiculosPorPagina))));
        onAtualizado();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function pedirExclusaoCliente() {
    setConfirmandoExclusaoCliente(true);
  }

  function confirmarExclusaoCliente() {
    startTransition(async () => {
      const res = await deletarClienteAction(cliente.id);
      if (res.sucesso) {
        toast.success("Cliente excluído com sucesso.");
        setConfirmandoExclusaoCliente(false);
        onAtualizado();
        onFechar();
      } else {
        toast.error(res.erro);
      }
    });
  }

  const concluidosCount = historico?.totalConcluidos || 0;
  const textoVisitas = concluidosCount === 1 ? "1 visita concluída" : `${concluidosCount} visitas concluídas`;

  return (
    <>
      <Modal aberto={true} onFechar={onFechar} titulo="Ficha do Cliente" maxWidth="max-w-4xl">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* LADO ESQUERDO: PERFIL DO CLIENTE */}
          <div className="w-full md:w-80 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-6">
            <div className="space-y-5">
              
              {/* Cabeçalho do perfil */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-[#E56B25] font-bold text-base">
                  {cliente.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                    {cliente.nome}
                  </h2>
                  <span className="inline-block text-xs font-medium text-zinc-400 mt-0.5">
                    Cliente #{cliente.codigo}
                  </span>
                </div>
              </div>

              {/* Informações de contato */}
              <div className="space-y-3.5 bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    WhatsApp
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {cliente.telefone}
                    </span>
                    <a
                      href={gerarLinkWhatsApp(cliente.telefone, `Olá, ${cliente.nome}! Tudo bem? Falamos da estética automotiva.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded transition-colors shadow-xs shrink-0"
                      title="Abrir conversa no WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      Conversar
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                    E-mail
                  </label>
                  <p className="text-sm text-zinc-300 truncate">
                    {cliente.email || "Não informado"}
                  </p>
                </div>
              </div>

              {/* Resumo de Atendimentos */}
              <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800 space-y-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Resumo de Atendimentos
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-zinc-950/70 p-2.5 rounded border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                      Total Gasto
                    </span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      R$ {(historico?.totalGasto || 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div className="bg-zinc-950/70 p-2.5 rounded border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase block">
                      Visitas
                    </span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {textoVisitas}
                    </span>
                  </div>
                </div>

                {historico && historico.totalConcluidos > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Ticket médio:</span>
                    <span className="font-bold text-white">
                      R$ {historico.ticketMedio.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Ações do Cliente */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditandoCliente(true)}
                className="w-full h-9 px-3 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Dados
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={pedirExclusaoCliente}
                className="w-full h-9 px-3 border border-red-900/40 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Cliente
              </button>
            </div>
          </div>

          {/* LADO DIREITO: ABAS DE HISTÓRICO E GARAGEM */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Navegação entre abas - estilo limpo 2019 */}
              <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAbaAtiva("historico")}
                  className={`px-3.5 py-1.5 rounded text-xs font-bold transition-colors ${
                    abaAtiva === "historico"
                      ? "bg-[#E56B25] text-white shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  Histórico de Serviços ({historico?.agendamentos?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva("veiculos")}
                  className={`px-3.5 py-1.5 rounded text-xs font-bold transition-colors ${
                    abaAtiva === "veiculos"
                      ? "bg-[#E56B25] text-white shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  Garagem de Veículos ({totalVeiculos})
                </button>
              </div>

              {/* ABA 1: HISTÓRICO */}
              {abaAtiva === "historico" ? (
                <div className="space-y-2.5 min-h-[220px] max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {carregandoHistorico ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      Carregando atendimentos...
                    </div>
                  ) : historico?.agendamentos && historico.agendamentos.length > 0 ? (
                    historico.agendamentos.map((ag) => (
                      <div
                        key={ag.id}
                        className="p-3.5 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#E56B25]" />
                              {new Date(ag.data_hora).toLocaleDateString("pt-BR", { dateStyle: "short" })}
                              {" às "}
                              {new Date(ag.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {ag.veiculo_modelo && (
                              <span className="text-[11px] px-2 py-0.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-300 font-semibold uppercase">
                                {ag.veiculo_modelo} {ag.veiculo_placa ? `· ${ag.veiculo_placa}` : ""}
                              </span>
                            )}
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2.5">
                            <span className="text-sm font-bold text-white">
                              R$ {Number(ag.valor).toFixed(2).replace(".", ",")}
                            </span>
                            <StatusBadge status={ag.status} />
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-zinc-300 mt-1">
                          {ag.servicos.map((s) => s.nome).join(" · ")}
                        </p>

                        {ag.observacoes && (
                          <div className="mt-2 text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                            <strong className="text-zinc-300 font-medium">Nota:</strong> {ag.observacoes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg">
                      <p className="text-xs font-medium text-zinc-400">
                        Nenhum atendimento anterior registrado para este cliente.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* ABA 2: GARAGEM */
                <div className="space-y-3 min-h-[220px]">
                  <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                    {veiculosVisiveis.length ? (
                      veiculosVisiveis.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                              <Car className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white uppercase truncate">
                                {v.modelo}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span>{v.placa ? `Placa: ${v.placa}` : "Sem placa informada"}</span>
                                {v.cor && <span>· Cor: {v.cor}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => pedirExclusaoVeiculo(v.id)}
                            className="text-xs font-semibold text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-lg">
                        <p className="text-xs font-medium text-zinc-400">Nenhum veículo cadastrado na garagem.</p>
                      </div>
                    )}
                  </div>

                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaginaVeiculos((p) => Math.max(1, p - 1))}
                        disabled={paginaAtual === 1}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Anterior
                      </button>
                      <span className="text-zinc-500 font-medium">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaginaVeiculos((p) => Math.min(totalPaginas, p + 1))}
                        disabled={paginaAtual === totalPaginas}
                        className="inline-flex items-center gap-1 font-semibold text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        Próxima
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Formulário de cadastro de novo veículo */}
                  <form
                    onSubmit={handleAdicionarVeiculo}
                    className="mt-4 pt-3.5 border-t border-zinc-800 flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      required
                      value={veiculoModelo}
                      onChange={(e) => setVeiculoModelo(e.target.value)}
                      className={`${inputClass} flex-1 min-w-0`}
                      placeholder="Modelo (ex: BMW M3, Civic)"
                    />
                    <div className="flex gap-2">
                      <input
                        value={veiculoPlaca}
                        onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
                        className={`${inputClass} w-24 uppercase min-w-0`}
                        placeholder="Placa"
                      />
                      <input
                        value={veiculoCor}
                        onChange={(e) => setVeiculoCor(e.target.value)}
                        className={`${inputClass} w-24 min-w-0`}
                        placeholder="Cor"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={pending || !veiculoModelo.trim()}
                      className="px-3.5 h-9 bg-[#E56B25] hover:bg-[#cf5818] text-white text-xs font-bold rounded transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ModalClienteForm
        aberto={editandoCliente}
        onFechar={() => setEditandoCliente(false)}
        onSalvo={() => {
          setEditandoCliente(false);
          onAtualizado();
        }}
        clienteEdicao={cliente}
      />

      {/* Modais de confirmação */}
      <ConfirmModal
        aberto={veiculoParaRemover !== null}
        titulo="Remover veículo"
        mensagem="Tem certeza que deseja remover este veículo da garagem do cliente?"
        textoConfirmar="Remover"
        destrutivo
        pending={pending}
        onConfirmar={confirmarExclusaoVeiculo}
        onFechar={() => setVeiculoParaRemover(null)}
      />

      <ConfirmModal
        aberto={confirmandoExclusaoCliente}
        titulo="Excluir cliente"
        mensagem={`Tem certeza que deseja excluir ${cliente.nome} e todo o seu histórico? Essa ação não pode ser desfeita.`}
        textoConfirmar="Excluir cliente"
        destrutivo
        pending={pending}
        onConfirmar={confirmarExclusaoCliente}
        onFechar={() => setConfirmandoExclusaoCliente(false)}
      />
    </>
  );
}
