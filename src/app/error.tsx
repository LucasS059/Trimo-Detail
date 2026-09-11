'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro interceptado na aplicação:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 selection:bg-[#E56B25] selection:text-white">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-950/30 border border-red-900/50 shadow-xl">
          <AlertTriangle className="w-9 h-9 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Algo deu errado
          </h1>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">
            Ocorreu uma instabilidade inesperada ao carregar esta tela. Você pode tentar recarregar ou voltar para o início.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-[#E56B25] hover:bg-[#cf5818] text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-[#E56B25]/20"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl transition-colors text-sm text-center"
          >
            Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
