"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { criarServicoAction, atualizarServicoAction } from "@/lib/actions/servicos";
import { InputHora } from "@/components/ui/input-hora"; // <-- Importamos o seu componente!
import { toast } from "sonner";
import { Servico } from "./servicos-lista";

const campo = {
  label: "text-[11px] font-semibold uppercase tracking-wider text-white",
  input: "w-full h-10 px-3 mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-400 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm",
  textarea: "w-full p-3 mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-400 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm resize-none",
};

// Converte minutos do banco (ex: 90) para o formato do input (ex: "01:30")
function minutosParaHHMM(minutos: number) {
  if (!minutos) return "";
  const h = Math.floor(minutos / 60).toString().padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

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
  const [duracaoDefault, setDuracaoDefault] = useState(""); // Armazena o valor inicial HH:MM
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (aberto) {
      if (servicoEdicao) {
        setNome(servicoEdicao.nome);
        setDescricao(servicoEdicao.descricao || "");
        setPreco(Number(servicoEdicao.preco).toFixed(2).replace(".", ","));
        setDuracaoDefault(minutosParaHHMM(servicoEdicao.duracao_minutos)); // Preenche no formato 01:30
        setAtivo(servicoEdicao.ativo);
      } else {
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracaoDefault("");
        setAtivo(true);
      }
    }
  }, [aberto, servicoEdicao]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Pega o valor do InputHora via FormData (já que ele gerencia o próprio estado)
    const formData = new FormData(e.currentTarget);
    const duracaoDigitada = formData.get("duracao") as string;
    
    const precoFormatado = Number(preco.replace(",", "."));
    
    // Converte a hora digitada (ex: "01:30") de volta para minutos inteiros (ex: 90)
    let duracaoMinutosFormatada = 0;
    if (duracaoDigitada && duracaoDigitada.includes(":")) {
      const [h, m] = duracaoDigitada.split(":");
      duracaoMinutosFormatada = (parseInt(h || "0", 10) * 60) + parseInt(m || "0", 10);
    }

    if (isNaN(precoFormatado) || duracaoMinutosFormatada <= 0) {
      toast.error("Preço e Duração precisam ser valores válidos.");
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div>
          <label className={campo.label}>Nome do Serviço</label>
          <input 
            required 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            className={campo.input} 
            placeholder="Ex: Polimento Comercial" 
          />
        </div>

        <div>
          <label className={campo.label}>Descrição <span className="text-zinc-500 font-normal">(Opcional)</span></label>
          <textarea 
            value={descricao} 
            onChange={(e) => setDescricao(e.target.value)} 
            rows={3}
            className={campo.textarea} 
            placeholder="Detalhes rápidos sobre o serviço." 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={campo.label}>Preço (R$)</label>
            <input 
              required 
              value={preco} 
              onChange={(e) => setPreco(e.target.value)} 
              className={campo.input} 
              placeholder="120,00" 
            />
          </div>
          <div>
            <label className={campo.label}>Duração (Hora)</label>
            <InputHora 
              name="duracao"
              required 
              defaultValue={duracaoDefault} 
              className={campo.input} 
            />
            <p className="text-[10px] text-zinc-500 mt-1.5 font-medium">Ex: 01:30 para 1h e meia</p>
          </div>
        </div>

        {servicoEdicao && (
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="ativoCheckbox"
              checked={ativo} 
              onChange={(e) => setAtivo(e.target.checked)} 
              className="w-4 h-4 bg-zinc-900 border-zinc-600 rounded focus:ring-[#E56B25] accent-[#E56B25] transition-colors cursor-pointer"
            />
            <label htmlFor="ativoCheckbox" className="text-sm font-semibold text-white cursor-pointer select-none">
              Serviço Ativo <span className="text-zinc-400 font-normal text-xs">(visível no agendamento)</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 mt-2">
          <button type="button" onClick={onFechar} disabled={pending} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
            {pending ? "Salvando..." : "Salvar Serviço"}
          </button>
        </div>
      </form>
    </Modal>
  );
}