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
  cor_primaria?: string | null;
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

  const iniciais = loja.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="min-h-screen bg-zinc-950"
      style={{ ["--brand" as any]: loja.cor_primaria || "#E56B25" }}
    >
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">
        <header className="flex flex-col items-center text-center mb-8">
          {loja.imagem_url ? (
            <img
              src={loja.imagem_url}
              alt={loja.nome}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-zinc-800 shadow-lg mb-4"
            />
          ) : (
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-4 shadow-lg"
              style={{ backgroundColor: "var(--brand,#E56B25)" }}
            >
              {iniciais || "?"}
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{loja.nome}</h1>
          {loja.nome_dono && (
            <p className="text-sm font-medium mt-1" style={{ color: "var(--brand,#E56B25)" }}>
              {loja.nome_dono}
            </p>
          )}
          {loja.descricao && (
            <p className="text-sm text-zinc-400 mt-3 max-w-sm leading-relaxed">{loja.descricao}</p>
          )}
        </header>

        {loja.endereco && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6 shadow-sm">
            <div className="px-4 py-3 flex items-start gap-2.5 border-b border-zinc-800">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{loja.endereco}</p>
            </div>
            <iframe
              title="Localização"
              src={`https://www.google.com/maps?q=${encodeURIComponent(loja.endereco)}&output=embed`}
              className="w-full h-36 sm:h-44 grayscale-[15%] contrast-[1.05]"
              loading="lazy"
            />
          </div>
        )}

        {agendamentoConcluido ? (
          <div
            className="border rounded-2xl p-6 text-center"
            style={{ backgroundColor: "color-mix(in srgb, var(--brand,#E56B25) 8%, transparent)", borderColor: "color-mix(in srgb, var(--brand,#E56B25) 35%, transparent)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "var(--brand,#E56B25)" }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="font-bold text-white text-base">Agendamento confirmado!</p>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
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

        <p className="text-center text-[11px] text-zinc-600 mt-10">
          Agendamento online via Trimo Detail
        </p>
      </div>
    </div>
  );
}