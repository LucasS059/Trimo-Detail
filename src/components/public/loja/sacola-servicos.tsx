"use client";

import { useState, useTransition, useCallback } from "react";
import { formatarMoeda } from "@/lib/formatters";
import { criarAgendamentoPublico, buscarClientePorContatoAction } from "@/lib/actions/agendamentos";
import { toast } from "sonner";
import { criarHandlerTelefone, normalizarTelefone } from "@/lib/utils/contato";
import { X, ChevronDown, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

type ServicoSacola = {
  id: string;
  nome: string;
  preco: number | string;
  duracao_minutos: number;
};

type VeiculoCadastrado = {
  id: string;
  modelo: string;
  placa: string | null;
  cor: string | null;
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
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [veiculosCadastrados, setVeiculosCadastrados] = useState<VeiculoCadastrado[]>([]);
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState<string | null>(null);

  // Dados do cliente
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Dados do veículo (novo)
  const [modelo, setModelo] = useState("");
  const [placa, setPlaca] = useState("");
  const [cor, setCor] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleTelefoneChange = criarHandlerTelefone(setTelefone);

  // Lookup de cliente ao sair do campo de telefone
  const handleTelefoneBlur = useCallback(async () => {
    const telefoneLimpo = normalizarTelefone(telefone);
    if (telefoneLimpo.replace(/\D/g, "").length < 10) return;

    setBuscandoCliente(true);
    setClienteEncontrado(false);
    try {
      const resultado = await buscarClientePorContatoAction(slugLoja, telefoneLimpo);
      if (resultado.sucesso && resultado.dados) {
        const { nome: nomeCliente, email: emailCliente, veiculos } = resultado.dados;
        setNome(nomeCliente);
        setEmail(emailCliente ?? "");
        setVeiculosCadastrados(veiculos);
        if (veiculos.length > 0) {
          setVeiculoSelecionadoId(veiculos[0].id);
        }
        setClienteEncontrado(true);
      } else {
        setClienteEncontrado(false);
        setVeiculosCadastrados([]);
        setVeiculoSelecionadoId(null);
      }
    } catch {
      // silencioso — não atrapalhar o fluxo
    } finally {
      setBuscandoCliente(false);
    }
  }, [telefone, slugLoja]);

  async function handleConfirmar() {
    if (!horario || servicos.length === 0) return;

    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha seu nome e WhatsApp para confirmar.");
      return;
    }

    // Se não há veículo selecionado nem novo veículo digitado
    const veiculoSelecionado = veiculosCadastrados.find((v) => v.id === veiculoSelecionadoId);
    if (!veiculoSelecionado && !modelo.trim()) {
      toast.error("Informe o modelo do veículo.");
      return;
    }

    startTransition(async () => {
      const resposta = await criarAgendamentoPublico({
        lojaSlug: slugLoja,
        nome,
        telefone: normalizarTelefone(telefone),
        email: email || undefined,
        modeloVeiculo: veiculoSelecionado ? veiculoSelecionado.modelo : modelo,
        placaVeiculo: veiculoSelecionado ? (veiculoSelecionado.placa ?? undefined) : placa || undefined,
        corVeiculo: veiculoSelecionado ? (veiculoSelecionado.cor ?? undefined) : cor || undefined,
        servicosIds: servicos.map((s) => s.id),
        dataHora: horario,
        observacoes: observacoes.trim() || undefined,
      });

      if (resposta.sucesso && resposta.dados?.agendamentoId) {
        onConcluido(resposta.dados.agendamentoId);
      } else if (!resposta.sucesso) {
        toast.error(resposta.erro || "Não foi possível confirmar o agendamento.");
        const msg = resposta.erro.toLowerCase();
        if (msg.includes("indisponível") || msg.includes("conflita")) {
          onRemoverHorario();
          onContinuarParaHorario();
          setDrawerAberto(false);
        }
      } else {
        toast.error("Não foi possível obter o ID do agendamento criado.");
      }
    });
  }

  const total = servicos.reduce((soma, s) => soma + Number(s.preco), 0);
  const duracaoTotal = servicos.reduce((soma, s) => soma + s.duracao_minutos, 0);

  const formulario = horario && (
    <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Seus dados</p>

      {/* Campo de telefone — é o primeiro, dispara o lookup */}
      <div className="relative">
        <input
          type="tel"
          placeholder="WhatsApp"
          value={telefone}
          onChange={handleTelefoneChange}
          onBlur={handleTelefoneBlur}
          inputMode="numeric"
          maxLength={16}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors pr-10"
        />
        {buscandoCliente && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
        )}
      </div>

      {clienteEncontrado && (
        <div className="flex items-start gap-2 bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-300 leading-relaxed">
            Cadastro encontrado — dados preenchidos automaticamente.
          </p>
        </div>
      )}

      <input
        type="text"
        placeholder="Seu nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
      />

      <input
        type="email"
        placeholder="E-mail (opcional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
      />

      {/* Seção do veículo */}
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mt-2 mb-1">Veículo</p>

      {veiculosCadastrados.length > 0 ? (
        <div className="flex flex-col gap-2">
          {veiculosCadastrados.map((v) => (
            <label
              key={v.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                veiculoSelecionadoId === v.id
                  ? "border-[var(--brand)] bg-[var(--brand)]/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              <input
                type="radio"
                name="veiculo"
                value={v.id}
                checked={veiculoSelecionadoId === v.id}
                onChange={() => setVeiculoSelecionadoId(v.id)}
                className="accent-[var(--brand)]"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{v.modelo}</p>
                <p className="text-xs text-zinc-500">
                  {[v.placa, v.cor].filter(Boolean).join(" · ") || "Sem placa/cor"}
                </p>
              </div>
            </label>
          ))}
          <label
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
              veiculoSelecionadoId === null
                ? "border-[var(--brand)] bg-[var(--brand)]/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
          >
            <input
              type="radio"
              name="veiculo"
              value=""
              checked={veiculoSelecionadoId === null}
              onChange={() => setVeiculoSelecionadoId(null)}
              className="accent-[var(--brand)]"
            />
            <p className="text-sm text-zinc-400">Outro veículo</p>
          </label>

          {veiculoSelecionadoId === null && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
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
                  placeholder="Placa (opcional)"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors uppercase"
                />
                <input
                  type="text"
                  placeholder="Cor (opcional)"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
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
              placeholder="Placa (opcional)"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors uppercase"
            />
            <input
              type="text"
              placeholder="Cor (opcional)"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors"
            />
          </div>
        </div>
      )}

      <textarea
        placeholder="Observações ou pedidos especiais (opcional)"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--brand)] outline-none transition-colors resize-none mt-1"
      />
    </div>
  );

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
              <span className="text-zinc-200 font-bold">{formatarMoeda(s.preco)}</span>
              <button
                onClick={() => onRemoverServico(s.id)}
                className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                title="Remover"
              >
                <X className="w-4 h-4" />
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

      {formulario}

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-zinc-800/60">
        <span className="text-sm text-zinc-400">Total ({duracaoTotal} min)</span>
        <span className="text-lg font-black text-white font-mono">{formatarMoeda(total)}</span>
        <span className="text-lg font-bold text-white">{formatarMoeda(total)}</span>
      </div>
    </div>
  );

  // Validação de habilitação do botão
  const veiculoOk = veiculoSelecionadoId !== null || modelo.trim().length > 0;
  const podeConfirmar = !!horario && nome.trim().length > 0 && telefone.trim().length > 0 && veiculoOk;

  if (servicos.length === 0) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6">
        {listaItens}
        {mostrarBotaoContinuar && !horario && (
          <button
            onClick={onContinuarParaHorario}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition-all"
          >
            Escolher horário
          </button>
        )}
        {horario && (
          <button
            onClick={handleConfirmar}
            disabled={pending || !podeConfirmar}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
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
            <p className="text-xs text-[var(--brand)] font-semibold mt-0.5 flex items-center gap-1">
              Ver detalhes
              <ChevronDown className="w-3.5 h-3.5" />
            </p>
          </div>
          <button
            onClick={() => {
              if (horario) handleConfirmar();
              else {
                if (!drawerAberto && !mostrarBotaoContinuar) setDrawerAberto(true);
                else onContinuarParaHorario();
              }
            }}
            disabled={pending || (!!horario && !podeConfirmar)}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition disabled:opacity-40 shrink-0 flex items-center gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? "Aguarde..." : horario ? "Confirmar" : "Avançar"}
          </button>
        </div>
      </div>

      {drawerAberto && (
        <div
          onClick={(e) => e.target === e.currentTarget && setDrawerAberto(false)}
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-h-[90vh] bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-white">Resumo</h2>
              <button
                onClick={() => setDrawerAberto(false)}
                className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {listaItens}
            {horario && (
              <button
                onClick={handleConfirmar}
                disabled={pending || !podeConfirmar}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? "Processando..." : "Confirmar agendamento"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
