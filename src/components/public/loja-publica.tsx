"use client";
// components/public/loja-publica.tsx

import { useState } from "react";
import { SeletorServico } from "@/components/public/seletor-servico";
import { SeletorHorario } from "@/components/public/seletor-horario";
import { FormularioAgendamento } from "@/components/public/formulario-agendamento";

type Loja = {
  id: string;
  slug: string;
  nome: string;
  nome_dono: string | null;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
};

type Servico = {
  id: string;
  nome: string;
  preco: string;
  duracao_minutos: number;
};

export function LojaPublica({ loja, servicos }: { loja: Loja; servicos: Servico[] }) {
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<Date | null>(null);
  const [agendamentoConcluido, setAgendamentoConcluido] = useState<string | null>(null);

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <header className="mb-8">
        {loja.imagem_url && (
          <img
            src={loja.imagem_url}
            alt={loja.nome}
            className="w-full h-40 object-cover rounded-xl mb-4"
          />
        )}
        <h1 className="text-2xl font-semibold">{loja.nome}</h1>
        {loja.nome_dono && <p className="text-sm text-gray-500">{loja.nome_dono}</p>}
        {loja.descricao && <p className="text-sm text-gray-600 mt-2">{loja.descricao}</p>}
        {loja.endereco && <p className="text-sm text-gray-500 mt-1">{loja.endereco}</p>}
      </header>

      {agendamentoConcluido ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="font-medium text-green-800">Agendamento confirmado!</p>
          <p className="text-sm text-green-700 mt-1">
            Você vai receber a confirmação por WhatsApp com o link de acompanhamento.
          </p>
        </div>
      ) : !servicoSelecionado ? (
        <SeletorServico servicos={servicos} onSelecionar={setServicoSelecionado} />
      ) : !horarioSelecionado ? (
        <SeletorHorario
          lojaId={loja.id}
          servico={servicoSelecionado}
          onSelecionar={setHorarioSelecionado}
          onVoltar={() => setServicoSelecionado(null)}
        />
      ) : (
        <FormularioAgendamento
          slugLoja={loja.slug}
          servico={servicoSelecionado}
          horario={horarioSelecionado}
          onVoltar={() => setHorarioSelecionado(null)}
          onConcluido={(id) => setAgendamentoConcluido(id)}
        />
      )}
    </div>
  );
}
