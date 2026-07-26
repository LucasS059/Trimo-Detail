"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { criarServicoAction, atualizarServicoAction } from "@/lib/actions/servicos";
import { toast } from "sonner";
import { Servico } from "./servicos-lista";

export function ModalServicoForm({
  aberto,
  onFechar,
  onSalvo,
  servicoEdicao,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  servicoEdicao?: Servico | null;
}) {
  const [pending, startTransition] = useTransition();
  
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (aberto) {
      if (servicoEdicao) {
        setNome(servicoEdicao.nome);
        setDescricao(servicoEdicao.descricao || "");
        setPreco(Number(servicoEdicao.preco).toFixed(2).replace(".", ","));
        // Transforma os minutos do banco em horas (Ex: 90 -> 1.5)
        setDuracao((servicoEdicao.duracao_minutos / 60).toString().replace(".", ","));
        setAtivo(servicoEdicao.ativo);
      } else {
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setAtivo(true);
      }
    }
  }, [aberto, servicoEdicao]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Trata preço
    const precoFormatado = Number(preco.replace(",", "."));
    // Trata a hora digitada e converte de volta para minutos
    const duracaoHoras = Number(duracao.replace(",", "."));
    const duracaoMinutosFormatada = Math.round(duracaoHoras * 60);

    if (isNaN(precoFormatado) || isNaN(duracaoMinutosFormatada)) {
      toast.error("Preço e Duração precisam ser números válidos.");
      return;
    }

    startTransition(async () => {
      try {
        if (servicoEdicao) {
          await atualizarServicoAction(servicoEdicao.id, {
            nome,
            descricao,
            preco: precoFormatado,
            duracaoMinutos: duracaoMinutosFormatada,
            ativo,
          });
          toast.success("Serviço atualizado com sucesso!");
        } else {
          await criarServicoAction({
            nome,
            descricao,
            preco: precoFormatado,
            duracaoMinutos: duracaoMinutosFormatada,
          });
          toast.success("Serviço criado com sucesso!");
        }
        onSalvo();
      } catch (err) {
        toast.error("Erro ao salvar serviço.");
      }
    });
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={servicoEdicao ? "Editar Serviço" : "Novo Serviço"} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div>
          <label className="text-xs font-semibold text-zinc-700">Nome do Serviço</label>
          <input 
            required 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            className="w-full h-10 px-3 mt-1 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" 
            placeholder="Ex: Polimento Comercial" 
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Descrição (Opcional)</label>
          <textarea 
            value={descricao} 
            onChange={(e) => setDescricao(e.target.value)} 
            rows={3}
            className="w-full p-3 mt-1 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm resize-none" 
            placeholder="Detalhes rápidos sobre o serviço." 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700">Preço (R$)</label>
            <input 
              required 
              value={preco} 
              onChange={(e) => setPreco(e.target.value)} 
              className="w-full h-10 px-3 mt-1 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" 
              placeholder="120,00" 
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700">Duração (Horas)</label>
            <input 
              required 
              type="text"
              value={duracao} 
              onChange={(e) => setDuracao(e.target.value)} 
              className="w-full h-10 px-3 mt-1 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" 
              placeholder="Ex: 1,5" 
            />
            <p className="text-[10px] text-zinc-400 mt-1">Use decimais (Ex: 1.5 = 1h30)</p>
          </div>
        </div>

        {servicoEdicao && (
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="ativoCheckbox"
              checked={ativo} 
              onChange={(e) => setAtivo(e.target.checked)} 
              className="w-4 h-4 text-[#E56B25] border-zinc-300 rounded focus:ring-[#E56B25] accent-[#E56B25]"
            />
            <label htmlFor="ativoCheckbox" className="text-sm font-semibold text-zinc-700 cursor-pointer">
              Serviço Ativo (visível no agendamento)
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-2">
          <button type="button" onClick={onFechar} disabled={pending} className="px-4 py-2.5 rounded-lg border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-lg bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
            {pending ? "Salvando..." : "Salvar Serviço"}
          </button>
        </div>
      </form>
    </Modal>
  );
}