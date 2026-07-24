"use client";
// components/public/formulario-agendamento.tsx

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { criarAgendamentoPublico } from "@/lib/actions/agendamentos";

type Servico = { id: string; nome: string; preco: string };

export function FormularioAgendamento({
  slugLoja,
  servico,
  horario,
  onVoltar,
  onConcluido,
}: {
  slugLoja: string;
  servico: Servico;
  horario: Date;
  onVoltar: () => void;
  onConcluido: (agendamentoId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await criarAgendamentoPublico({
          slugLoja,
          servicoId: servico.id,
          dataHoraISO: horario.toISOString(),
          nomeCliente: nome,
          telefoneCliente: telefone,
        });
        onConcluido(resultado.agendamentoId);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível agendar");
      }
    });
  }

  return (
    <div>
      <button onClick={onVoltar} className="text-sm text-gray-500 mb-3">
        ← Trocar horário
      </button>

      <div className="bg-gray-100 rounded-xl p-4 mb-4 text-sm">
        <p className="font-medium">{servico.nome}</p>
        <p className="text-gray-600">
          {horario.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} às{" "}
          {horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Seu nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            placeholder="(11) 99999-9999"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Agendando..." : "Confirmar agendamento"}
        </Button>
      </form>
    </div>
  );
}
