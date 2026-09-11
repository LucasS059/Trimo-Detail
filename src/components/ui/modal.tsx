"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  aberto,
  onFechar,
  titulo,
  maxWidth = "max-w-lg",
  footer,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  maxWidth?: string;
  footer?: ReactNode;
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className={`flex flex-col w-full ${maxWidth} max-h-[92vh] sm:max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
      >
        {/* Header fixo */}
        <div className="shrink-0 px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-md">
          <h2 className="text-base font-bold text-white tracking-tight truncate">{titulo}</h2>
          <button
            onClick={onFechar}
            aria-label="Fechar modal"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com scroll interno fluido */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {children}
        </div>

        {/* Footer fixo se fornecido */}
        {footer && (
          <div className="shrink-0 px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
