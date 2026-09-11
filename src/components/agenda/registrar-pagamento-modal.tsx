"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { finalizarComBaixaManual, finalizarComPix, finalizarComPoint } from "@/lib/actions/agendamentos";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

const estilo = {
  metodoBotao:
    "flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:border-zinc-500 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none",
  metodoLabel: "text-sm font-semibold text-white",
  metodoDetalhe: "text-xs text-zinc-400",
  campoPix:
    "w-full text-xs p-2.5 border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-300 select-all",
};

export function RegistrarPagamentoModal({
  aberto,
  onFechar,
  agendamentoId,
  clienteNome,
  valor,
  pixExistente,
}: {
  aberto: boolean;
  onFechar: () => void;
  agendamentoId: string;
  clienteNome: string;
  valor: number;
  pixExistente?: DadosPix | null;
}) {
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<"metodo" | "manual" | "pix">("metodo");
  const [detalheManual, setDetalheManual] = useState("dinheiro");
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(pixExistente ?? null);

  useEffect(() => {
    if (aberto) {
      setEtapa("metodo");
      setDadosPix(pixExistente ?? null);
    }
  }, [aberto, pixExistente]);

  function handleGerarPix() {
    startTransition(async () => {
      try {
        const resposta = await finalizarComPix(agendamentoId, valor);
        
        if (!resposta.sucesso) {
          toast.error(resposta.erro);
          return;
        }

        if (resposta.dados) {
          setDadosPix(resposta.dados);
        }
        
        setEtapa("pix");
        toast.success("Cobrança Pix gerada com sucesso!");
      } catch (e: any) {
        toast.error(e.message || "Erro ao gerar Pix.");
      }
    });
  }

  function handlePoint() {
    startTransition(async () => {
      try {
        const resposta = await finalizarComPoint(agendamentoId, valor);
        if (!resposta.sucesso) {
          toast.error(resposta.erro);
          return;
        }
        toast.success("Ordem enviada para a maquininha Point!");
        onFechar();
      } catch (e: any) {
        toast.error(e.message || "Erro ao conectar com a maquininha.");
      }
    });
  }

  function handleBaixaManual() {
    startTransition(async () => {
      try {
        const resposta = await finalizarComBaixaManual(agendamentoId, valor, detalheManual);
        if (resposta && !resposta.sucesso) {
          toast.error(resposta.erro);
          return;
        }
        toast.success("Pagamento registrado com sucesso!");
        onFechar();
      } catch (e: any) {
        toast.error(e.message || "Erro ao registrar pagamento.");
      }
    });
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={`Registrar Pagamento — ${clienteNome}`} maxWidth="max-w-md">
      <div className="flex flex-col gap-4 p-1">
        {etapa === "metodo" && (
          <div className="flex flex-col gap-3">
            <button onClick={handleGerarPix} disabled={pending} className={estilo.metodoBotao}>
              <div>
                <p className={estilo.metodoLabel}>Pix Dinâmico</p>
                <p className={estilo.metodoDetalhe}>Gera QR Code e Copia e Cola instantâneo</p>
              </div>
              <span className="text-xs font-bold text-[#E56B25]">Selecionar</span>
            </button>

            <button onClick={handlePoint} disabled={pending} className={estilo.metodoBotao}>
              <div>
                <p className={estilo.metodoLabel}>Maquininha (Point)</p>
                <p className={estilo.metodoDetalhe}>Envia cobrança direta para o terminal</p>
              </div>
              <span className="text-xs font-bold text-[#E56B25]">Selecionar</span>
            </button>

            <button onClick={() => setEtapa("manual")} disabled={pending} className={estilo.metodoBotao}>
              <div>
                <p className={estilo.metodoLabel}>Baixa Manual / Dinheiro / Cartão</p>
                <p className={estilo.metodoDetalhe}>Registra recebimento externo ou em espécie</p>
              </div>
              <span className="text-xs font-bold text-[#E56B25]">Selecionar</span>
            </button>
          </div>
        )}

        {etapa === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-300">Forma de recebimento</label>
              <select
                value={detalheManual}
                onChange={(e) => setDetalheManual(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-sm outline-none focus:border-[#E56B25]"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito (Externo)</option>
                <option value="cartao_credito">Cartão de Crédito (Externo)</option>
                <option value="pix_manual">Pix Manual (Comprovante)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="secondary" onClick={() => setEtapa("metodo")} disabled={pending}>
                Voltar
              </Button>
              <Button onClick={handleBaixaManual} disabled={pending}>
                {pending ? "Salvando..." : "Confirmar Baixa"}
              </Button>
            </div>
          </div>
        )}

        {etapa === "pix" && dadosPix && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-zinc-300">Escaneie o QR Code abaixo com o aplicativo do seu banco:</p>
            {dadosPix.qrCodeBase64 && (
              <img
                src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-48 h-48 bg-white p-2 rounded-xl border border-zinc-700 object-contain"
              />
            )}
            {dadosPix.copiaECola && (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  readOnly
                  value={dadosPix.copiaECola}
                  onClick={(e) => e.currentTarget.select()}
                  className={estilo.campoPix}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(dadosPix.copiaECola!);
                    toast.success("Código Copia e Cola copiado!");
                  }}
                >
                  Copiar Código Pix
                </Button>
              </div>
            )}
            <button onClick={() => setEtapa("metodo")} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mt-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Escolher outro método
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}