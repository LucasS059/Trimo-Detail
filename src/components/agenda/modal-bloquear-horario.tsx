"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InputHora } from "@/components/ui/input-hora";
import { toast } from "sonner";

import { 
  criarBloqueioPeloAdmin, 
  excluirBloqueioPeloAdmin 
} from "@/lib/actions/agendamentos";

export type Bloqueio = {
  id: string;
  inicio: string; 
  fim: string;
  motivo: string | null;
};

const campo = {
  label: "text-sm font-bold text-zinc-300",
  input:
    "h-10 w-full px-3 rounded-lg border border-zinc-600 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all disabled:opacity-60 disabled:cursor-not-allowed",
};

export function ModalBloquearHorario({ bloqueios = [] }: { bloqueios?: Bloqueio[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const data = formData.get("data") as string;
    const horaInicio = formData.get("horaInicio") as string;
    const horaFim = formData.get("horaFim") as string;
    const motivo = formData.get("motivo") as string;

    const inicio = new Date(`${data}T${horaInicio}:00`);
    const fim = new Date(`${data}T${horaFim}:00`);

    startTransition(async () => {
      const res = await criarBloqueioPeloAdmin({
        inicio,
        fim,
        motivo: motivo ? String(motivo) : undefined,
      });
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Horário bloqueado com sucesso!");
      setIsOpen(false);
    });
  }

  function handleExcluir(id: string) {
    startTransition(async () => {
      const res = await excluirBloqueioPeloAdmin(id);
      if (!res.sucesso) {
        toast.error(res.erro);
        return;
      }
      toast.success("Bloqueio removido com sucesso!");
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm"
      >
        Gerenciar Bloqueios
      </button>

      <Modal aberto={isOpen} onFechar={() => setIsOpen(false)} titulo="Gerenciar Horários Bloqueados" maxWidth="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-2">
          
          {/* LADO ESQUERDO: Formulário para NOVO bloqueio */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white border-b border-zinc-700 pb-2">Novo Bloqueio</h3>
            
            <form action={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className={campo.label}>Data do bloqueio</label>
                <input
                  required
                  name="data"
                  type="date"
                  className={`${campo.input} [color-scheme:dark]`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={campo.label}>Hora início</label>
                  <InputHora name="horaInicio" required className={campo.input} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={campo.label}>Hora fim</label>
                  <InputHora name="horaFim" required className={campo.input} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={campo.label}>Motivo (opcional)</label>
                <input
                  name="motivo"
                  type="text"
                  placeholder="Ex: Horário de almoço"
                  className={campo.input}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {pending ? "Bloqueando..." : "Confirmar bloqueio"}
                </button>
              </div>
            </form>
          </div>

          {/* LADO DIREITO: Lista de bloqueios ativos */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white border-b border-zinc-700 pb-2">Bloqueios Ativos</h3>
            
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
              {bloqueios.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Nenhum horário bloqueado no momento.
                </p>
              ) : (
                bloqueios.map((bloqueio: Bloqueio) => {
                  const dataInicio = new Date(bloqueio.inicio);
                  const dataFim = new Date(bloqueio.fim);

                  return (
                    <div key={bloqueio.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 bg-zinc-800/50">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {dataInicio.toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-xs font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300">
                            {`${dataInicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${dataFim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        </div>
                        {bloqueio.motivo && (
                          <span className="text-xs text-zinc-400">{bloqueio.motivo}</span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleExcluir(bloqueio.id)}
                        disabled={pending}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
                        title="Remover bloqueio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </Modal>
    </>
  );
}