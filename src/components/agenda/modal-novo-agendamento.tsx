"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InputHora } from "@/components/ui/input-hora";
import { criarAgendamentoPeloAdmin } from "@/lib/actions/agendamentos";
import {
  buscarClientesAutocompleteAction,
  listarVeiculosClienteAction,
} from "@/lib/actions/clientes";
import { toast } from "sonner";

type ClienteResultado = { id: string; nome: string; telefone: string };
type VeiculoResultado = { id: string; placa: string | null; modelo: string; cor: string | null };

const campo = {
  label: "text-sm font-bold text-zinc-300",
  input:
    "h-10 px-3 rounded-lg border border-zinc-600 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25] focus:ring-1 focus:ring-[#E56B25] transition-all disabled:opacity-60 disabled:cursor-not-allowed",
};

export function ModalNovoAgendamento({ servicos }: { servicos: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // --- busca de cliente ---
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteResultado | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- campos de cliente novo (quando ninguém foi selecionado) ---
  const [telefoneNovo, setTelefoneNovo] = useState("");
  const [veiculoTextoLivre, setVeiculoTextoLivre] = useState("");

  // --- veículos do cliente selecionado ---
  const [veiculos, setVeiculos] = useState<VeiculoResultado[]>([]);
  const [veiculoEscolhaId, setVeiculoEscolhaId] = useState<string>(""); // "" | "novo" | id real
  const [veiculoModeloNovo, setVeiculoModeloNovo] = useState("");
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);

  function resetarTudo() {
    setTermoBusca("");
    setResultados([]);
    setDropdownAberto(false);
    setClienteSelecionado(null);
    setTelefoneNovo("");
    setVeiculoTextoLivre("");
    setVeiculos([]);
    setVeiculoEscolhaId("");
    setVeiculoModeloNovo("");
  }

  function handleDigitarNome(valor: string) {
    setTermoBusca(valor);
    setDropdownAberto(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const encontrados = await buscarClientesAutocompleteAction(valor);
        setResultados(encontrados);
      } finally {
        setBuscando(false);
      }
    }, 300);
  }

  function selecionarCliente(cliente: ClienteResultado) {
    setClienteSelecionado(cliente);
    setTermoBusca(cliente.nome);
    setDropdownAberto(false);
    setResultados([]);

    setCarregandoVeiculos(true);
    listarVeiculosClienteAction(cliente.id)
      .then((lista) => setVeiculos(lista))
      .finally(() => setCarregandoVeiculos(false));
  }

  function trocarCliente() {
    resetarTudo();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await criarAgendamentoPeloAdmin(formData);
        setIsOpen(false);
        toast.success("Agendamento criado com sucesso!");
        resetarTudo();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao criar agendamento");
      }
    });
  }

  function fecharModal() {
    setIsOpen(false);
    resetarTudo();
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors shadow-lg shadow-[#E56B25]/20 flex items-center gap-2"
      >
        <span>+</span> Novo agendamento
      </button>

      <Modal aberto={isOpen} onFechar={fecharModal} titulo="Novo Agendamento" maxWidth="max-w-2xl">
        <form action={handleSubmit} className="flex flex-col gap-6">
          {clienteSelecionado && <input type="hidden" name="clienteId" value={clienteSelecionado.id} />}
          {veiculoEscolhaId && veiculoEscolhaId !== "novo" && (
            <input type="hidden" name="veiculoId" value={veiculoEscolhaId} />
          )}

          {/* --- Bloco Cliente --- */}
          <div className="flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <label className={campo.label}>Cliente</label>
              {clienteSelecionado && (
                <button
                  type="button"
                  onClick={trocarCliente}
                  className="text-xs font-semibold text-[#E56B25] hover:text-[#ff8a4a] transition-colors"
                >
                  Trocar cliente
                </button>
              )}
            </div>

            <input
              name="nome"
              type="text"
              required
              autoComplete="off"
              disabled={!!clienteSelecionado}
              value={termoBusca}
              onChange={(e) => handleDigitarNome(e.target.value)}
              onFocus={() => termoBusca.length >= 2 && setDropdownAberto(true)}
              onBlur={() => setTimeout(() => setDropdownAberto(false), 150)}
              className={campo.input}
              placeholder="Digite o nome do cliente..."
            />

            {dropdownAberto && !clienteSelecionado && (
              <div className="absolute top-[68px] left-0 right-0 z-10 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                {buscando && <p className="px-4 py-3 text-sm text-zinc-500">Buscando...</p>}

                {!buscando && termoBusca.trim().length >= 2 && resultados.length === 0 && (
                  <p className="px-4 py-3 text-sm text-zinc-500">
                    Nenhum cliente encontrado — preencha os dados abaixo pra cadastrar um novo.
                  </p>
                )}

                {!buscando &&
                  resultados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selecionarCliente(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-zinc-800 transition-colors flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-semibold text-white truncate">{c.nome}</span>
                      <span className="text-xs text-zinc-500 shrink-0">{c.telefone}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* --- Telefone: readonly se cliente existente, editável se novo --- */}
          <div className="flex flex-col gap-2">
            <label className={campo.label}>Telefone (WhatsApp)</label>
            <input
              name="telefone"
              type="text"
              required
              disabled={!!clienteSelecionado}
              value={clienteSelecionado ? clienteSelecionado.telefone : telefoneNovo}
              onChange={(e) => setTelefoneNovo(e.target.value)}
              className={campo.input}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* --- Veículo: dropdown se cliente existente, texto livre se novo --- */}
          <div className="flex flex-col gap-2">
            <label className={campo.label}>Veículo</label>

            {clienteSelecionado ? (
              <>
                <select
                  value={veiculoEscolhaId}
                  onChange={(e) => setVeiculoEscolhaId(e.target.value)}
                  className={`${campo.input} appearance-none`}
                  disabled={carregandoVeiculos}
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    {carregandoVeiculos ? "Carregando veículos..." : "Sem veículo informado"}
                  </option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                      {v.modelo}{v.placa ? ` · ${v.placa}` : ""}
                    </option>
                  ))}
                  <option value="novo" className="bg-zinc-900 text-[#E56B25] font-semibold">
                    + Cadastrar novo veículo
                  </option>
                </select>

                {veiculoEscolhaId === "novo" && (
                  <input
                    name="veiculoModeloNovo"
                    type="text"
                    value={veiculoModeloNovo}
                    onChange={(e) => setVeiculoModeloNovo(e.target.value)}
                    className={`${campo.input} mt-1`}
                    placeholder="Ex: Honda Civic Preto"
                  />
                )}
              </>
            ) : (
              <input
                name="veiculoModeloNovo"
                type="text"
                value={veiculoTextoLivre}
                onChange={(e) => setVeiculoTextoLivre(e.target.value)}
                className={campo.input}
                placeholder="Ex: Honda Civic Preto (opcional)"
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className={campo.label}>Serviço</label>
            <select required name="servicoId" className={`${campo.input} appearance-none`}>
              <option value="" className="bg-zinc-900 text-zinc-400">Selecione um serviço...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900 text-white">{s.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Data</label>
              <input required name="data" type="date" className={`${campo.input} [color-scheme:dark]`} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={campo.label}>Hora</label>
              <InputHora name="hora" required className={campo.input} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-700">
            <Button variant="secondary" type="button" onClick={fecharModal} disabled={pending}>
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Criar Agendamento"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}