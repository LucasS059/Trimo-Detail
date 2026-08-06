"use client";
// components/public/loja/loja-publica.tsx

import { useState } from "react";
import { SeletorServico } from "@/components/public/loja/seletor-servico";
import { SacolaServicos } from "@/components/public/loja/sacola-servicos";
import { LojaPublicaHeader } from "@/components/public/loja/loja-publica-header";
import { LojaPublicaMapa } from "@/components/public/loja/loja-publica-mapa";
import { SeletorHorario } from "@/components/public/agendamentos/seletor-horario";
import { ResumoSelecao } from "@/components/public/agendamentos/resumo-selecao";
import { ConfirmacaoAgendamento } from "@/components/public/agendamentos/confirmacao-agendamento";
import { estiloTemaLoja, corMarca } from "@/lib/tema-loja";

type Loja = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
  cor_primaria?: string | null;
};

type Servico = {
  id: string;
  nome: string;
  preco: number | string;
  duracao_minutos: number;
};

type Etapa = "servicos" | "horario" | "concluido";

export function LojaPublica({ loja, servicos }: { loja: Loja; servicos: Servico[] }) {
  const [servicosSelecionados, setServicosSelecionados] = useState<Servico[]>([]);
  const [mostrarHorario, setMostrarHorario] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<Date | null>(null);
  const [agendamentoConcluido, setAgendamentoConcluido] = useState<string | null>(null);

  const brand = corMarca(loja.cor_primaria);
  const etapa: Etapa = agendamentoConcluido ? "concluido" : mostrarHorario ? "horario" : "servicos";

  function alternarServico(id: string) {
    setServicosSelecionados((atual) => {
      const jaSelecionado = atual.some((s) => s.id === id);
      if (jaSelecionado) return atual.filter((s) => s.id !== id);
      const servico = servicos.find((s) => s.id === id);
      return servico ? [...atual, servico] : atual;
    });
  }

  function removerServico(id: string) {
    setServicosSelecionados((atual) => atual.filter((s) => s.id !== id));
  }

  return (
    // Novo conceito: Tela inteira sem scroll no container pai no desktop
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row text-zinc-100" style={estiloTemaLoja(loja.cor_primaria)}>
      
      {/* PAINEL ESQUERDO: Contexto e Resumo (Fixo) */}
      <div className="lg:w-[40%] xl:w-[35%] bg-zinc-900/40 border-b lg:border-b-0 lg:border-r border-zinc-800 lg:h-screen lg:sticky lg:top-0 overflow-y-auto flex flex-col">
        <div className="p-6 lg:p-10 flex-1">
          <LojaPublicaHeader loja={loja} brand={brand} />
          
          {loja.endereco && (
            <div className="mt-6 mb-8">
              <LojaPublicaMapa endereco={loja.endereco} />
            </div>
          )}

          {/* A Sacola agora fica embutida no layout esquerdo no Desktop, sem parecer um card flutuante */}
          {etapa !== "concluido" && (
            <div className="hidden lg:block mt-8 pt-8 border-t border-zinc-800/50">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resumo do Agendamento</h3>
              <SacolaServicos
                slugLoja={loja.slug}
                servicos={servicosSelecionados}
                onRemoverServico={removerServico}
                horario={horarioSelecionado}
                onRemoverHorario={() => setHorarioSelecionado(null)}
                mostrarBotaoContinuar={etapa === "servicos"}
                onContinuarParaHorario={() => setMostrarHorario(true)}
                onConcluido={(id) => setAgendamentoConcluido(id)}
              />
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO: Área de Ação e Fluxo */}
      <div className="lg:w-[60%] xl:w-[65%] pb-24 lg:pb-0 lg:h-screen lg:overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 lg:p-12 xl:p-16">
          
          {/* Indicador de Passo (Stepper) - Organiza a mente do usuário */}
          {etapa !== "concluido" && (
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-zinc-800/50">
              <div className={`flex items-center gap-2 text-sm font-semibold ${etapa === 'servicos' ? 'text-[var(--brand)]' : 'text-zinc-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${etapa === 'servicos' ? 'bg-[var(--brand)]/10' : 'bg-zinc-800 text-zinc-400'}`}>1</span>
                Serviços
              </div>
              <div className="w-8 h-px bg-zinc-800" />
              <div className={`flex items-center gap-2 text-sm font-semibold ${etapa === 'horario' ? 'text-[var(--brand)]' : 'text-zinc-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${etapa === 'horario' ? 'bg-[var(--brand)]/10' : 'bg-zinc-800 text-zinc-400'}`}>2</span>
                Horário
              </div>
            </div>
          )}

          {/* Renderização da Etapa Atual */}
          <main className="animate-in fade-in slide-in-from-right-4 duration-500">
            {etapa === "concluido" && <ConfirmacaoAgendamento slugLoja={loja.slug} brand={brand} />}

            {etapa === "horario" && horarioSelecionado && (
              <ResumoSelecao
                servicos={servicosSelecionados}
                horario={horarioSelecionado}
                brand={brand}
                onTrocarHorario={() => setHorarioSelecionado(null)}
                onTrocarServicos={() => {
                  setMostrarHorario(false);
                  setHorarioSelecionado(null);
                }}
              />
            )}

            {etapa === "horario" && !horarioSelecionado && (
              <SeletorHorario
                lojaId={loja.id}
                servicos={servicosSelecionados}
                onSelecionar={setHorarioSelecionado}
                onVoltar={() => setMostrarHorario(false)}
              />
            )}

            {etapa === "servicos" && (
              <SeletorServico
                servicos={servicos}
                selecionadosIds={servicosSelecionados.map((s) => s.id)}
                onAlternar={alternarServico}
              />
            )}
          </main>

        </div>
      </div>

      {/* Sacola Mobile continua fixa embaixo, pois no celular não há espaço para split screen */}
      {etapa !== "concluido" && (
        <div className="lg:hidden">
          <SacolaServicos
            slugLoja={loja.slug}
            servicos={servicosSelecionados}
            onRemoverServico={removerServico}
            horario={horarioSelecionado}
            onRemoverHorario={() => setHorarioSelecionado(null)}
            mostrarBotaoContinuar={etapa === "servicos"}
            onContinuarParaHorario={() => setMostrarHorario(true)}
            onConcluido={(id) => setAgendamentoConcluido(id)}
          />
        </div>
      )}
    </div>
  );
}