"use client";

import { useState, useTransition } from "react";
import { formatarMoeda } from "@/lib/formatters";
import { criarAgendamentoPublico } from "@/lib/actions/agendamentos";
import { toast } from "sonner";
import { criarHandlerTelefone, normalizarTelefone } from "@/lib/utils/contato";

type ServicoSacola = {
  id: string;
  nome: string;
  preco: string;
  duracao_minutos: number;
};

export function SacolaServicos({
  slugLoja,
  servicos,
  onRemoverServico,
  horario,
  onRemoverHorario,
  mostrarBotaoContinuar,
  onContinuarParaHorario,
  onConcluido,
}: {
  slugLoja: string;
  servicos: ServicoSacola[];
  onRemoverServico: (id: string) => void;
  horario: Date | null;
  onRemoverHorario: () => void;
  mostrarBotaoContinuar: boolean;
  onContinuarParaHorario: () => void;
  onConcluido: (agendamentoId: string) => void;
}) {
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  
  // Dados do cliente
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  
  // Dados do veículo (separados conforme a tabela 'veiculos' do DB)
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [cor, setCor] = useState("");

  const handleTelefoneChange = criarHandlerTelefone(setTelefone);

  async function handleConfirmar() {
    if (!horario || servicos.length === 0) return;
    
    // Validação básica obrigatória
    if (!nome.trim() || !telefone.trim() || !modelo.trim()) {
      toast.error("Preencha seu nome, WhatsApp e o modelo do veículo para confirmar.");
      return;
    }

    startTransition(async () => {
      // O backend agora vai receber esses dados estruturados
      const resposta = await criarAgendamentoPublico({
        lojaSlug: slugLoja,
        nome,
        telefone: normalizarTelefone(telefone),
        email,
        modeloVeiculo: modelo,
        placaVeiculo: placa,
        corVeiculo: cor,
        servicosIds: servicos.map((s) => s.id),
        dataHora: horario,
      });

      if (!resposta.sucesso) {
        toast.error(resposta.erro);
        const msg = resposta.erro.toLowerCase();
        if (msg.includes("indisponível") || msg.includes("conflita")) {
          onRemoverHorario();
          onContinuarParaHorario();
          setDrawerAberto(false);
        }
        return;
      }

      onConcluido(resposta.dados as string);
    });
  }

  const total = servicos.reduce((soma, s) => soma + Number(s.preco), 0);
  const duracaoTotal = servicos.reduce((soma, s) => soma + s.duracao_minutos, 0);

  const listaItens = (
    <div className="flex flex-col gap-4 mb-6">
      <div className="space-y-3">
        {servicos.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <div className="min-w-0 pr-4">
              <p className="font-semibold text-white truncate">{s.nome}</p>
              <p className="text-zinc-500 text-xs">{s.duracao_minutos} min</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-zinc-300 font-bold">{formatarMoeda(s.preco)}</span>
              <button
                onClick={() => onRemoverServico(s.id)}
                className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                title="Remover"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-zinc-800/60" />

      {horario && (
        <div className="flex items-center justify-between text-sm bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-300">
            <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="capitalize">{horario.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
          <button
            onClick={onRemoverHorario}
            className="text-xs font-semibold text-[var(--brand)] hover:brightness-110"
          >
            Trocar
          </button>
        </div>
      )}

      {horario && (
        <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Seus Dados</p>
          <input
            type="text"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
          />
          <input
            type="tel"
            placeholder="Seu WhatsApp"
            value={telefone}
            onChange={handleTelefoneChange}
            inputMode="numeric"
            maxLength={16}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
          />
          <input
            type="email"
            placeholder="Seu E-mail (Opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
          />
          
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-2 mb-1">Veículo</p>
          <input
            type="text"
            placeholder="Modelo (ex: Honda Civic)"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Placa (Opcional)"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors uppercase"
            />
            <input
              type="text"
              placeholder="Cor (Opcional)"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-zinc-800/60">
        <span className="text-sm text-zinc-400">Total ({duracaoTotal} min)</span>
        <span className="text-lg font-black text-white font-mono">{formatarMoeda(total)}</span>
      </div>
    </div>
  );

  if (servicos.length === 0) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6">
        {listaItens}
        {mostrarBotaoContinuar && !horario && (
          <button
            onClick={onContinuarParaHorario}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition-all disabled:opacity-40"
          >
            Escolher horário
          </button>
        )}
        {horario && (
          <button
            onClick={handleConfirmar}
            disabled={pending || !nome.trim() || !telefone.trim() || !modelo.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Processando..." : "Confirmar agendamento"}
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-black to-transparent pt-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0" onClick={() => setDrawerAberto(true)}>
            <p className="text-sm font-bold text-white truncate">
              {servicos.length} {servicos.length === 1 ? "serviço" : "serviços"}
            </p>
            <p className="text-xs text-[var(--brand)] font-semibold mt-0.5">Ver detalhes ▾</p>
          </div>
          <button
            onClick={() => {
              if (horario) handleConfirmar();
              else {
                if (!drawerAberto && !mostrarBotaoContinuar) setDrawerAberto(true);
                else onContinuarParaHorario();
              }
            }}
            disabled={pending || (!!horario && (!nome.trim() || !telefone.trim() || !modelo.trim()))}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition disabled:opacity-40 shrink-0"
          >
            {pending ? "Aguarde..." : horario ? "Confirmar" : "Avançar"}
          </button>
        </div>
      </div>

      {drawerAberto && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDrawerAberto(false)}
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-h-[90vh] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">Resumo</h2>
              <button
                onClick={() => setDrawerAberto(false)}
                className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {listaItens}
          </div>
        </div>
      )}
    </>
  );
}