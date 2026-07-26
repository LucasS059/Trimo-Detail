"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { criarBloqueioPeloAdmin } from "@/lib/actions/agendamentos";
import { toast } from "sonner"; // <-- Importamos o toast

export function ModalBloquearHorario() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await criarBloqueioPeloAdmin(formData);
        setIsOpen(false);
        toast.success("Horário bloqueado com sucesso!"); // Pop-up elegante
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao bloquear horário.");
      }
    });
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
      >
        Bloquear horário
      </button>

      <Modal aberto={isOpen} onFechar={() => setIsOpen(false)} titulo="Bloquear horário" maxWidth="max-w-lg">
        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700">Data do bloqueio</label>
            <input
              required
              name="data"
              type="date"
              className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700">Hora início</label>
              <input
                required
                name="horaInicio"
                type="time"
                className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-700">Hora fim</label>
              <input
                required
                name="horaFim"
                type="time"
                className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-700">Motivo (opcional)</label>
            <input
              name="motivo"
              type="text"
              placeholder="Ex: Horário de almoço"
              className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <button 
              type="submit" 
              disabled={pending}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              {pending ? "Bloqueando..." : "Confirmar bloqueio"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}