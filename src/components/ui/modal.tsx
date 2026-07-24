"use client";

import { useEffect } from "react";

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
  children: React.ReactNode;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
    >
      <div className={`bg-white rounded-2xl w-full ${maxWidth} shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-zinc-400 hover:text-zinc-700 transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}