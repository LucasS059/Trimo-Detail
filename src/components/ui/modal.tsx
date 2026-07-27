"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function Modal({
  aberto,
  onFechar,
  titulo,
  maxWidth = "max-w-lg",
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  maxWidth?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className={`bg-zinc-800 border border-zinc-700 rounded-2xl w-full ${maxWidth} shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-zinc-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}