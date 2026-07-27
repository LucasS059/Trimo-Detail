"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ConfirmModal({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Voltar",
  destrutivo = false,
  pending = false,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destrutivo?: boolean;
  pending?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} maxWidth="max-w-sm">
      <div className={styles.wrapper}>
        <p className={styles.mensagem}>{mensagem}</p>

        <div className={styles.acoes}>
          {/* Adicionado whitespace-nowrap e text-sm para não quebrar a linha */}
          <Button 
            variant="secondary" 
            onClick={onFechar} 
            disabled={pending} 
            className="flex-1 whitespace-nowrap text-sm"
          >
            {textoCancelar}
          </Button>
          <Button
            onClick={onConfirmar}
            disabled={pending}
            className={`flex-1 whitespace-nowrap text-sm ${destrutivo ? styles.botaoDestrutivo : styles.botaoPrimario}`}
          >
            {pending ? "Aguarde..." : textoConfirmar}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const styles = {
  wrapper: "flex flex-col gap-6",
  mensagem: "text-sm text-zinc-300 leading-relaxed",
  // Voltamos ao items-center padrão
  acoes: "flex items-center gap-3", 
  botaoPrimario: "bg-[#E56B25] hover:bg-[#cf5818] text-white",
  botaoDestrutivo: "bg-red-600 hover:bg-red-700 text-white",
};