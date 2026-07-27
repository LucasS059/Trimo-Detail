"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { criarClienteAction, atualizarClienteAction } from "@/lib/actions/clientes";
import { toast } from "sonner";
import { Cliente } from "./clientes-lista";

const campo = {
  // Label agora é text-white para máximo contraste
  label: "text-[11px] font-semibold uppercase tracking-wider text-white",
  // Placeholder um pouco mais claro (zinc-400)
  input: "w-full h-10 px-3 mt-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-400 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all text-sm",
};

export function ModalClienteForm({
  aberto,
  onFechar,
  onSalvo,
  clienteEdicao,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  clienteEdicao?: Cliente | null;
}) {
  const [pending, startTransition] = useTransition();
  
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const [veiculoModelo, setVeiculoModelo] = useState("");
  const [veiculoPlaca, setVeiculoPlaca] = useState("");

  useEffect(() => {
    if (aberto) {
      setNome(clienteEdicao?.nome ?? "");
      setTelefone(clienteEdicao?.telefone ?? "");
      setEmail(clienteEdicao?.email ?? "");
      setVeiculoModelo("");
      setVeiculoPlaca("");
    }
  }, [aberto, clienteEdicao]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (clienteEdicao) {
          await atualizarClienteAction(clienteEdicao.id, { nome, telefone, email });
          toast.success("Dados do cliente atualizados!");
        } else {
          const payload: any = { nome, telefone, email };
          if (veiculoModelo) {
            payload.veiculo = { modelo: veiculoModelo, placa: veiculoPlaca };
          }
          await criarClienteAction(payload);
          toast.success("Cliente cadastrado com sucesso!");
        }
        onSalvo();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={clienteEdicao ? "Editar Cliente" : "Novo Cliente"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Dados Pessoais */}
        <div className="space-y-4">
          <div>
            <label className={campo.label}>Nome completo</label>
            <input required value={nome} onChange={(e) => setNome(e.target.value)} className={campo.input} placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={campo.label}>WhatsApp</label>
              <input required value={telefone} onChange={(e) => setTelefone(e.target.value)} className={campo.input} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className={campo.label}>E-mail (Opcional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo.input} placeholder="email@exemplo.com" />
            </div>
          </div>
        </div>

        {/* Cadastro Rápido de Veículo (Oculto na edição) */}
        {!clienteEdicao && (
          <div className="pt-5 border-t border-zinc-800 space-y-4">
            <p className="text-sm font-semibold text-white">Vincular Veículo <span className="text-zinc-400 font-normal">(Opcional)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={campo.label}>Modelo</label>
                <input value={veiculoModelo} onChange={(e) => setVeiculoModelo(e.target.value)} className={campo.input} placeholder="Ex: Civic G10" />
              </div>
              <div>
                <label className={campo.label}>Placa</label>
                <input value={veiculoPlaca} onChange={(e) => setVeiculoPlaca(e.target.value)} className={`${campo.input} uppercase`} placeholder="ABC-1234" />
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button type="button" onClick={onFechar} disabled={pending} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-zinc-800 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50">
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}