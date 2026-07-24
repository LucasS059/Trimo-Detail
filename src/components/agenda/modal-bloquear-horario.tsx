"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { criarBloqueioPeloAdmin } from "@/lib/actions/agendamentos";

export function ModalBloquearHorario() {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await criarBloqueioPeloAdmin(formData);
        setIsOpen(false);
      } catch (error) {
        console.error("Erro ao bloquear horário:", error);
      }
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Bloquear horário
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Bloquear Horário</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                ✕
              </button>
            </div>

            <form action={handleSubmit} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-700">Data do Bloqueio</label>
                <input required name="data" type="date" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-zinc-700">Hora Início</label>
                  <input required name="horaInicio" type="time" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-zinc-700">Hora Fim</label>
                  <input required name="horaFim" type="time" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-zinc-700">Motivo (Opcional)</label>
                <input name="motivo" type="text" className="h-10 px-3 rounded-lg border border-zinc-300 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all" placeholder="Ex: Horário de Almoço" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button variant="secondary" type="button" onClick={() => setIsOpen(false)} disabled={pending}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={pending}>
                  {pending ? "Bloqueando..." : "Confirmar Bloqueio"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}