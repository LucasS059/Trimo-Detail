"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
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
  
  // Form inline para veículos (Agora com Cor)
  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [veiculoCor, setVeiculoCor] = useState("");

  // Paginação Interna de Veículos
  const [paginaVeiculos, setPaginaVeiculos] = useState(1);
  const veiculosPorPagina = 3;
  
  const totalVeiculos = cliente.veiculos?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(totalVeiculos / veiculosPorPagina));
  
  const paginaAtual = Math.min(paginaVeiculos, totalPaginas);
  
  const startIndex = (paginaAtual - 1) * veiculosPorPagina;
  const veiculosVisiveis = cliente.veiculos?.slice(startIndex, startIndex + veiculosPorPagina) || [];

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

  function handleExcluirVeiculo(veiculoId: string) {
    if (!confirm("Remover este veículo?")) return;
    startTransition(async () => {
      try {
        await deletarVeiculoAction(veiculoId);
        toast.success("Veículo removido.");
        onAtualizado();
      } catch (err) {
        toast.error("Erro ao remover veículo.");
      }
    });
  }

  function handleExcluirCliente() {
    if (!confirm("Excluir o cliente e todo o seu histórico?")) return;
    startTransition(async () => {
      try {
        await deletarClienteAction(cliente.id);
        toast.success("Cliente excluído.");
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
          <div className="w-full md:w-1/3 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-zinc-100 pb-6 md:pb-0 md:pr-8">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight uppercase mb-6">{cliente.nome}</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">WhatsApp</p>
                  <p className="text-sm font-semibold text-zinc-800">{cliente.telefone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">E-mail</p>
                  <p className="text-sm font-medium text-zinc-600 truncate">{cliente.email || "Não informado"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-2">
              <button onClick={() => setEditandoCliente(true)} className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
                Editar Cadastro
              </button>
              <button disabled={pending} onClick={handleExcluirCliente} className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                Excluir Cliente
              </button>
            </div>
          </div>

          {/* LADO DIREITO: VEÍCULOS PAGINADOS */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">
                Garagem do Cliente
              </h3>
              
              <div className="space-y-3 min-h-[168px]">
                {veiculosVisiveis.length ? (
                  veiculosVisiveis.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-black text-zinc-900 uppercase truncate">{v.modelo}</span>
                        <span className="text-xs px-2 py-1 bg-white border border-zinc-200 rounded uppercase font-mono font-bold text-zinc-600 tracking-widest shrink-0">
                          {v.placa || "S/ PLACA"}
                        </span>
                        {/* A Cor reapareceu aqui! */}
                        {v.cor && (
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase hidden sm:block truncate max-w-[80px]">
                            {v.cor}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleExcluirVeiculo(v.id)} 
                        className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 shrink-0 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
                    <p className="text-sm font-medium text-zinc-500">Nenhum veículo cadastrado.</p>
                  </div>
                )}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button 
                    onClick={() => setPaginaVeiculos((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors px-2 py-1"
                  >
                    ← Anterior
                  </button>
                  <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button 
                    onClick={() => setPaginaVeiculos((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors px-2 py-1"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>

            {/* Formulário Fixo no Fundo (Agora com Modelo, Placa e COR) */}
            <form onSubmit={handleAdicionarVeiculo} className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row gap-2 shrink-0">
              <input 
                required 
                value={veiculoModelo} 
                onChange={(e) => setVeiculoModelo(e.target.value)} 
                className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 text-sm outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] min-w-0" 
                placeholder="Modelo (Ex: Onix)" 
              />
              <div className="flex gap-2">
                <input 
                  value={veiculoPlaca} 
                  onChange={(e) => setVeiculoPlaca(e.target.value)} 
                  className="w-1/2 sm:w-24 h-10 px-3 rounded-lg border border-zinc-300 text-sm uppercase outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] min-w-0" 
                  placeholder="Placa" 
                />
                <input 
                  value={veiculoCor} 
                  onChange={(e) => setVeiculoCor(e.target.value)} 
                  className="w-1/2 sm:w-24 h-10 px-3 rounded-lg border border-zinc-300 text-sm outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] min-w-0" 
                  placeholder="Cor" 
                />
              </div>
              <button 
                type="submit" 
                disabled={pending || !veiculoModelo} 
                className="w-full sm:w-auto px-4 h-10 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50 shrink-0"
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
    </>
  );
}