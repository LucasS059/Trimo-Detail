"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { criarClienteAction, atualizarClienteAction } from "@/lib/actions/clientes";
import { toast } from "sonner";
import { Cliente } from "./clientes-lista";

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
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-700">Nome completo</label>
            <input required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full h-9 px-3 mt-1 rounded-md border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700">WhatsApp</label>
              <input required value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full h-9 px-3 mt-1 rounded-md border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700">E-mail (Opcional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-9 px-3 mt-1 rounded-md border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" placeholder="email@exemplo.com" />
            </div>
          </div>
        </div>

        {/* Cadastro Rápido de Veículo (Oculto na edição) */}
        {!clienteEdicao && (
          <div className="pt-4 border-t border-zinc-200 space-y-3">
            <p className="text-sm font-semibold text-zinc-900">Vincular Veículo (Opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700">Modelo</label>
                <input value={veiculoModelo} onChange={(e) => setVeiculoModelo(e.target.value)} className="w-full h-9 px-3 mt-1 rounded-md border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm" placeholder="Ex: Civic G10" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700">Placa</label>
                <input value={veiculoPlaca} onChange={(e) => setVeiculoPlaca(e.target.value)} className="w-full h-9 px-3 mt-1 rounded-md border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] text-sm uppercase" placeholder="ABC-1234" />
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar} disabled={pending} className="px-4 py-2 rounded-md text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="px-4 py-2 rounded-md bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {pending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}