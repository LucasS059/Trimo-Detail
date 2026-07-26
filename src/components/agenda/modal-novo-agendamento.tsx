"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { criarAgendamentoPeloAdmin } from "@/lib/actions/agendamentos";
import { toast } from "sonner"; // <-- Importamos o toast

export function ModalNovoAgendamento({ servicos }: { servicos: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await criarAgendamentoPeloAdmin(formData);
        setIsOpen(false);
        toast.success("Agendamento criado com sucesso!"); // Pop-up elegante
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar agendamento");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors shadow-lg shadow-[#E56B25]/20 flex items-center gap-2"
      >
        <span>+</span> Novo agendamento
      </button>

      <Modal aberto={isOpen} onFechar={() => setIsOpen(false)} titulo="Novo Agendamento" maxWidth="max-w-2xl">
        <form action={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-700">Nome do Cliente</label>
              <input required name="nome" type="text" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all" placeholder="Ex: João Silva" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-700">Telefone (WhatsApp)</label>
              <input required name="telefone" type="text" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all" placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-zinc-700">Serviço</label>
            <select required name="servicoId" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all bg-white">
              <option value="">Selecione um serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-700">Data</label>
              <input required name="data" type="date" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-700">Hora</label>
              <input required name="hora" type="time" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <button 
              type="submit" 
              disabled={pending} 
              className="px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Criar Agendamento"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}