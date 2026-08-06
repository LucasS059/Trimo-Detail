"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModalServicoForm } from "./modal-servico-form";
import { ConfirmModal } from "@/components/ui/confirm-modal"; // <-- O mesmo modal das outras telas
import { excluirServicoAction } from "@/lib/actions/servicos";
import { toast } from "sonner";

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  /** pg numeric chega como string; aceita number para formulários locais */
  preco: number | string;
  duracao_minutos: number;
  ativo: boolean;
};

// Transforma "90" em "1h 30min", "120" em "2h", "45" em "45min"
function formatarDuracao(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export function ServicosLista({ servicos }: { servicos: Servico[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEdicao, setServicoEdicao] = useState<Servico | null>(null);
  const [servicoParaRemover, setServicoParaRemover] = useState<Servico | null>(null); // Estado para o modal de exclusão

  function handleNovo() {
    setServicoEdicao(null);
    setModalAberto(true);
  }

  function handleEditar(servico: Servico) {
    setServicoEdicao(servico);
    setModalAberto(true);
  }

  // Abre o modal de confirmação
  function pedirExclusao(servico: Servico) {
    setServicoParaRemover(servico);
  }

  // Executa de fato a exclusão após o usuário confirmar
  function confirmarExclusao() {
    if (!servicoParaRemover) return;
    startTransition(async () => {
      const res = await excluirServicoAction(servicoParaRemover.id);
      if (res.sucesso) {
        toast.success("Serviço excluído com sucesso.");
        setServicoParaRemover(null);
        router.refresh();
      } else {
        toast.error(res.erro);
      }
    });
  }

  function handleSalvo() {
    setModalAberto(false);
    setServicoEdicao(null);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Serviços</h1>
            <p className="text-sm font-medium text-zinc-400 mt-0.5">
              Gerencie os serviços e valores oferecidos na estética
            </p>
          </div>
          <button 
            onClick={handleNovo}
            className="px-5 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors shadow-sm shadow-[#E56B25]/20 flex items-center justify-center gap-2"
          >
            <span>+</span> Novo Serviço
          </button>
        </div>

        {/* Grid de Cards (Dark Mode) */}
        {servicos.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl py-12 text-center">
            <p className="text-sm font-semibold text-zinc-500">Nenhum serviço cadastrado.</p>
            <p className="text-xs text-zinc-400 mt-1">Clique em "Novo Serviço" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicos.map((s) => (
              <div 
                key={s.id} 
                className={`bg-zinc-900 border rounded-2xl flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md ${
                  s.ativo ? "border-zinc-700 hover:border-[#E56B25]/50" : "border-zinc-800 opacity-70 grayscale-[0.3]"
                }`}
              >
                {/* Corpo do Card */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-black text-lg text-white leading-tight">{s.nome}</h3>
                    <span className={`shrink-0 px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${
                      s.ativo 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}>
                      {s.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
                    {s.descricao || "Sem descrição adicional."}
                  </p>

                  {/* Tags de Preço e Duração */}
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-bold text-white tabular-nums">
                      R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatarDuracao(s.duracao_minutos)}
                    </span>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="bg-zinc-900/50 border-t border-zinc-800 px-5 py-3 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => handleEditar(s)}
                    disabled={pending}
                    className="text-xs font-bold text-zinc-400 hover:text-white transition-colors px-2 py-1"
                  >
                    Editar
                  </button>
                  <div className="w-px h-4 bg-zinc-700"></div>
                  <button 
                    onClick={() => pedirExclusao(s)}
                    disabled={pending}
                    className="text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Criação / Edição */}
        <ModalServicoForm 
          aberto={modalAberto} 
          onFechar={() => setModalAberto(false)} 
          onSalvo={handleSalvo} 
          servicoEdicao={servicoEdicao} 
        />
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        aberto={servicoParaRemover !== null}
        titulo="Excluir Serviço"
        mensagem={`Tem certeza que deseja excluir o serviço "${servicoParaRemover?.nome}"? Isso não afetará os agendamentos antigos que já usaram ele.`}
        textoConfirmar="Excluir"
        destrutivo
        pending={pending}
        onConfirmar={confirmarExclusao}
        onFechar={() => setServicoParaRemover(null)}
      />
    </>
  );
}