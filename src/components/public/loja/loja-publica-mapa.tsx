"use client";
// components/public/loja/loja-publica-mapa.tsx

import { useState } from "react";

export function LojaPublicaMapa({ endereco }: { endereco: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center gap-2 text-left group"
      >
        <svg className="w-4 h-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p className="text-xs text-zinc-400 truncate flex-1 group-hover:text-zinc-300 transition-colors">
          {endereco}
        </p>
        <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0">
          {aberto ? "Fechar mapa" : "Ver mapa"}
        </span>
      </button>

      {aberto && (
        <div className="mt-2.5 rounded-xl overflow-hidden border border-zinc-800">
          <iframe
            title="Localização"
            src={`https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`}
            className="w-full h-28 grayscale-[15%] contrast-[1.05]"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}