"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ModalClienteDetalhes } from "./modal-cliente-detalhes";
import { ModalClienteForm } from "./modal-cliente-form";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  veiculos?: { id: string; placa: string | null; modelo: string; cor: string | null }[];
};

function getIniciais(nome: string) {
  const partes = nome.trim().split(" ");
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return nome.substring(0, 2).toUpperCase();
}

export function ClientesLista({ 
  clientes, 
  paginaAtual, 
  totalPaginas,
  totalClientes,
  buscaAtual
}: { 
  clientes: Cliente[];
  paginaAtual: number;
  totalPaginas: number;
  totalClientes: number;
  buscaAtual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [termoBusca, setTermoBusca] = useState(buscaAtual || "");
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  useEffect(() => {
  const timer = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString());
    const buscaAtualNaUrl = params.get("busca") || "";

    if (termoBusca === buscaAtualNaUrl) return;

    if (termoBusca) {
      params.set("busca", termoBusca);
    } else {
      params.delete("busca");
    }
    params.set("pagina", "1");

    router.push(`${pathname}?${params.toString()}`);
  }, 500);

  return () => clearTimeout(timer);
}, [termoBusca]);

  function mudarPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", novaPagina.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Buscar cliente por nome, telefone ou placa..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="w-full sm:max-w-md h-10 px-4 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 outline-none focus:border-[#E56B25]"
        />
        <button 
          onClick={() => setModalNovoAberto(true)}
          className="h-10 px-4 bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold rounded-xl transition-colors shrink-0"
        >
          Novo Cliente
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {clientes.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {clientes.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setClienteSelecionado(c)}
                className="p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm border border-zinc-700 shrink-0">
                    {getIniciais(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.nome}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{c.telefone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  {c.veiculos && c.veiculos.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700">
                      <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[100px]">
                        {c.veiculos[0].modelo}
                      </span>
                    </div>
                  )}
                  <svg className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <button 
              disabled={paginaAtual === 1}
              onClick={() => mudarPagina(paginaAtual - 1)}
              className="px-3 py-1.5 text-sm font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-zinc-500 font-medium">Página {paginaAtual} de {totalPaginas}</span>
            <button 
              disabled={paginaAtual === totalPaginas}
              onClick={() => mudarPagina(paginaAtual + 1)}
              className="px-3 py-1.5 text-sm font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      <ModalClienteForm aberto={modalNovoAberto} onFechar={() => setModalNovoAberto(false)} onSalvo={() => { setModalNovoAberto(false); router.refresh(); }} />
      {clienteSelecionado && (
        <ModalClienteDetalhes cliente={clienteSelecionado} onFechar={() => setClienteSelecionado(null)} onAtualizado={() => { setClienteSelecionado(null); router.refresh(); }} />
      )}
    </div>
  );
}