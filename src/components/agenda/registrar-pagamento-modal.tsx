"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { finalizarComBaixaManual, finalizarComPix } from "@/lib/actions/agendamentos";

type DadosPix = { qrCodeBase64?: string; copiaECola?: string; expiraEm?: string | Date | null };

// Classes agrupadas aqui em vez de espalhadas no JSX
const estilo = {
  metodoBotao:
    "flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-900 hover:bg-zinc-50 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none",
  metodoLabel: "text-sm font-semibold text-zinc-900",
  metodoDetalhe: "text-xs text-zinc-500",
  campoPix:
    "w-full text-xs p-2.5 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-600 select-all",
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
  const [etapa, setEtapa] = useState<"escolha" | "pix">(pixExistente?.qrCodeBase64 ? "pix" : "escolha");
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(pixExistente ?? null);
  const [erro, setErro] = useState<string | null>(null);

  // Reabrir sempre respeitando se já existe Pix pendente
  useEffect(() => {
    if (aberto) {
      setEtapa(pixExistente?.qrCodeBase64 ? "pix" : "escolha");
      setDadosPix(pixExistente ?? null);
      setErro(null);
    }
  }, [aberto, pixExistente]);

  function escolherPix() {
    if (dadosPix?.qrCodeBase64) {
      setEtapa("pix");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await finalizarComPix(agendamentoId);
        setDadosPix(resultado);
        setEtapa("pix");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível gerar o Pix.");
      }
    });
  }

  function escolherBaixaManual(detalhe: "dinheiro" | "cartao") {
    setErro(null);
    startTransition(async () => {
      try {
        await finalizarComBaixaManual({ agendamentoId, detalhe });
        onFechar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível registrar o pagamento.");
      }
    });
  }

  const titulo = etapa === "pix" ? "Cobrança Pix" : "Registrar pagamento";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} maxWidth="max-w-sm">
      {etapa === "escolha" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
            <span className="text-sm text-zinc-500">{clienteNome}</span>
            <span className="text-lg font-black text-zinc-900 font-mono tabular-nums">
              R$ {valor.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button className={estilo.metodoBotao} disabled={pending} onClick={escolherPix}>
              <span className={estilo.metodoLabel}>Pix</span>
              <span className={estilo.metodoDetalhe}>{pending ? "Gerando..." : "QR Code e copia e cola"}</span>
            </button>
            <button className={estilo.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("dinheiro")}>
              <span className={estilo.metodoLabel}>Dinheiro</span>
              <span className={estilo.metodoDetalhe}>Baixa manual</span>
            </button>
            <button className={estilo.metodoBotao} disabled={pending} onClick={() => escolherBaixaManual("cartao")}>
              <span className={estilo.metodoLabel}>Cartão</span>
              <span className={estilo.metodoDetalhe}>Máquina própria (baixa manual)</span>
            </button>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>
      )}

      {etapa === "pix" && dadosPix?.qrCodeBase64 && (
        <ConteudoPix dadosPix={dadosPix} valor={valor} clienteNome={clienteNome} />
      )}
    </Modal>
  );
}

function ConteudoPix({
  dadosPix,
  valor,
  clienteNome,
}: {
  dadosPix: DadosPix;
  valor: number;
  clienteNome: string;
}) {
  const [tempoRestante, setTempoRestante] = useState<string | null>(null);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (!dadosPix.expiraEm) return;
    const expiraEmDate = new Date(dadosPix.expiraEm);

    function atualizar() {
      const diffMs = expiraEmDate.getTime() - Date.now();
      if (diffMs <= 0) {
        setExpirado(true);
        setTempoRestante("Expirado");
        return;
      }
      const min = Math.floor(diffMs / 60000);
      const seg = Math.floor((diffMs % 60000) / 1000);
      setTempoRestante(`${min}:${seg.toString().padStart(2, "0")}`);
    }

    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  }, [dadosPix.expiraEm]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
        <span className="text-sm text-zinc-500">{clienteNome}</span>
        <span className="text-lg font-black text-zinc-900 font-mono tabular-nums">
          R$ {valor.toFixed(2).replace(".", ",")}
        </span>
      </div>

      <div className="flex justify-center">
        <img
          src={`data:image/png;base64,${dadosPix.qrCodeBase64}`}
          alt="QR Code Pix"
          className={`w-48 h-48 object-contain rounded-lg border border-zinc-100 ${expirado ? "opacity-30 grayscale" : ""}`}
        />
      </div>

      {tempoRestante && (
        <p className={`text-center text-sm font-mono font-bold ${expirado ? "text-red-500" : "text-zinc-700"}`}>
          {expirado ? "Cobrança expirada" : `Expira em ${tempoRestante}`}
        </p>
      )}

      {dadosPix.copiaECola && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            readOnly
            value={dadosPix.copiaECola}
            onClick={(e) => e.currentTarget.select()}
            className={estilo.campoPix}
          />
          <Button
            size="sm"
            className="w-full bg-[#E56B25] hover:bg-[#cf5818]"
            disabled={expirado}
            onClick={() => navigator.clipboard.writeText(dadosPix.copiaECola!)}
          >
            Copiar código Pix
          </Button>
        </div>
      )}

      <p className="text-[11px] text-center text-zinc-400">
        A tela atualiza automaticamente quando o pagamento for confirmado.
      </p>
    </div>
  );
}