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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        className={`flex flex-col w-full ${maxWidth} max-h-[92vh] sm:max-h-[90vh] bg-zinc-800 border border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
      >
        <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-700 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white truncate">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}