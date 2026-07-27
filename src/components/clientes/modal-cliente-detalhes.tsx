"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal"; // <-- Importamos nosso modal
import { Cliente } from "./clientes-lista";
import { criarVeiculoAction, deletarVeiculoAction } from "@/lib/actions/veiculos";
import { deletarClienteAction } from "@/lib/actions/clientes";
import { ModalClienteForm } from "./modal-cliente-form";
import { toast } from "sonner";

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
  
  // Estados para os modais de confirmação
  const [veiculoParaRemover, setVeiculoParaRemover] = useState<string | null>(null);
  const [confirmandoExclusaoCliente, setConfirmandoExclusaoCliente] = useState(false);
  
  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [veiculoCor, setVeiculoCor] = useState("");

  const [paginaVeiculos, setPaginaVeiculos] = useState(1);
  const veiculosPorPagina = 3;
  
  const totalVeiculos = cliente.veiculos?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalVeiculos / veiculosPorPagina));
  const paginaAtual = Math.min(paginaVeiculos, totalPaginas);
  const startIndex = (paginaAtual - 1) * veiculosPorPagina;
  const veiculosVisiveis = cliente.veiculos?.slice(startIndex, startIndex + veiculosPorPagina) || [];

  const inputClass = "h-10 px-3 rounded-lg border border-zinc-600 bg-zinc-900 text-white placeholder:text-zinc-400 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm";

  function handleAdicionarVeiculo(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await criarVeiculoAction(cliente.id, {
          modelo: veiculoModelo,
          placa: veiculoPlaca || undefined,
          cor: veiculoCor || undefined,
        });
        setVeiculoModelo("");
        setVeiculoPlaca("");
        setVeiculoCor("");
        
        const novaPaginacao = Math.ceil((totalVeiculos + 1) / veiculosPorPagina);
        setPaginaVeiculos(novaPaginacao);
        
        toast.success("Veículo adicionado!");
        onAtualizado();
      } catch (err) {
        toast.error("Erro ao adicionar veículo.");
      }
    });
  }

  // Acionada ao clicar em Remover (abre o modal)
  function pedirExclusaoVeiculo(veiculoId: string) {
    setVeiculoParaRemover(veiculoId);
  }

  // Executada de fato quando o dono confirma no Modal customizado
  function confirmarExclusaoVeiculo() {
    if (!veiculoParaRemover) return;
    startTransition(async () => {
      try {
        await deletarVeiculoAction(veiculoParaRemover);
        toast.success("Veículo removido.");
        setVeiculoParaRemover(null);
        onAtualizado();
      } catch (err) {
        toast.error("Erro ao remover veículo.");
      }
    });
  }

  // Acionada ao clicar em Excluir Cliente (abre o modal)
  function pedirExclusaoCliente() {
    setConfirmandoExclusaoCliente(true);
  }

  // Executada quando o dono confirma a exclusão do cliente
  function confirmarExclusaoCliente() {
    startTransition(async () => {
      try {
        await deletarClienteAction(cliente.id);
        toast.success("Cliente excluído.");
        setConfirmandoExclusaoCliente(false);
        onAtualizado();
        onFechar();
      } catch (err) {
        toast.error("Erro ao excluir cliente.");
      }
    });
  }

  return (
    <>
      <Modal aberto={true} onFechar={onFechar} titulo="Ficha do Cliente" maxWidth="max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LADO ESQUERDO: DADOS DO CLIENTE */}
          <div className="w-full md:w-1/3 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-zinc-700 pb-6 md:pb-0 md:pr-8">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase mb-6">{cliente.nome}</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">WhatsApp</p>
                  <p className="text-sm font-mono font-semibold text-white">{cliente.telefone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-1">E-mail</p>
                  <p className="text-sm font-medium text-white truncate">{cliente.email || "Não informado"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-700 flex flex-col gap-2">
              <button onClick={() => setEditandoCliente(true)} className="w-full px-4 py-2.5 border border-zinc-600 rounded-lg text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors">
                Editar Cadastro
              </button>
              <button disabled={pending} onClick={pedirExclusaoCliente} className="w-full px-4 py-2.5 border border-red-900/50 bg-red-950/30 text-red-400 rounded-lg text-sm font-bold hover:bg-red-900/50 hover:text-red-300 transition-colors disabled:opacity-50">
                Excluir Cliente
              </button>
            </div>
          </div>

          {/* LADO DIREITO: VEÍCULOS PAGINADOS */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Garagem do Cliente
              </h3>
              
              <div className="space-y-3 min-h-[168px]">
                {veiculosVisiveis.length ? (
                  veiculosVisiveis.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-black text-white uppercase truncate">{v.modelo}</span>
                        <span className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-600 rounded uppercase font-mono font-bold text-zinc-300 tracking-widest shrink-0">
                          {v.placa || "S/ PLACA"}
                        </span>
                        {v.cor && (
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase hidden sm:block truncate max-w-[80px]">
                            {v.cor}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => pedirExclusaoVeiculo(v.id)} 
                        className="text-xs font-bold text-zinc-400 hover:text-red-400 px-2 py-1 shrink-0 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-zinc-800/30 border border-dashed border-zinc-700 rounded-xl">
                    <p className="text-sm font-medium text-zinc-400">Nenhum veículo cadastrado.</p>
                  </div>
                )}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button 
                    onClick={() => setPaginaVeiculos((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="text-xs font-bold text-white hover:text-[#E56B25] disabled:opacity-30 transition-colors px-2 py-1"
                  >
                    ← Anterior
                  </button>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button 
                    onClick={() => setPaginaVeiculos((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="text-xs font-bold text-white hover:text-[#E56B25] disabled:opacity-30 transition-colors px-2 py-1"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>

            {/* Formulário Fixo no Fundo */}
            <form onSubmit={handleAdicionarVeiculo} className="mt-6 pt-5 border-t border-zinc-700 flex flex-col sm:flex-row gap-2 shrink-0">
              <input 
                required 
                value={veiculoModelo} 
                onChange={(e) => setVeiculoModelo(e.target.value)} 
                className={`${inputClass} flex-1 min-w-0`} 
                placeholder="Modelo (Ex: Onix)" 
              />
              <div className="flex gap-2">
                <input 
                  value={veiculoPlaca} 
                  onChange={(e) => setVeiculoPlaca(e.target.value)} 
                  className={`${inputClass} w-1/2 sm:w-24 uppercase min-w-0`} 
                  placeholder="Placa" 
                />
                <input 
                  value={veiculoCor} 
                  onChange={(e) => setVeiculoCor(e.target.value)} 
                  className={`${inputClass} w-1/2 sm:w-24 min-w-0`} 
                  placeholder="Cor" 
                />
              </div>
              <button 
                type="submit" 
                disabled={pending || !veiculoModelo} 
                className="w-full sm:w-auto px-4 h-10 bg-[#E56B25] text-white text-sm font-bold rounded-lg hover:bg-[#cf5818] transition-colors disabled:opacity-50 shrink-0"
              >
                Adicionar
              </button>
            </form>
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

      {/* MODAIS DE CONFIRMAÇÃO (Irmãos do modal principal) */}
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