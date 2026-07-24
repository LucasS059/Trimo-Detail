"use client";
// components/servicos/servico-form.tsx

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { criarServicoAction } from "@/lib/actions/servicos";

export function ServicoForm() {
  const [pending, startTransition] = useTransition();
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await criarServicoAction({
        nome,
        preco: Number(preco.replace(",", ".")),
        duracaoMinutos: Number(duracao),
      });
      setNome("");
      setPreco("");
      setDuracao("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-end gap-3"
    >
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Ex: Lavagem completa"
        />
      </div>
      <div className="w-32">
        <label className="block text-sm font-medium mb-1">Preço (R$)</label>
        <input
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="80,00"
        />
      </div>
      <div className="w-32">
        <label className="block text-sm font-medium mb-1">Duração (min)</label>
        <input
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          required
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="60"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  );
}
