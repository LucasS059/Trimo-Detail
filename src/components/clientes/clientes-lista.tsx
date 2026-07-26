"use client";

import { useState } from "react";
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
  
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  function handleAtualizado() {
    setModalNovoAberto(false);
    setClienteSelecionado(null);
    router.refresh();
  }

  // Aciona a busca direto no servidor
  function handleBuscar(termo: string) {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reseta para a primeira página na nova busca
    if (termo) {
      params.set("busca", termo);
    } else {
      params.delete("busca");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Aciona a troca de página
  function mudarPagina(novaPagina: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", novaPagina.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Clientes</h1>
          <p className="text-sm font-medium text-zinc-500 mt-0.5">
            {totalClientes} clientes na sua base
          </p>
        </div>
        <button 
          onClick={() => setModalNovoAberto(true)}
          className="px-5 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Novo Cliente
        </button>
      </div>

      {/* Barra de Busca Server-Side */}
      <div className="bg-white border border-zinc-200 rounded-xl p-1.5 flex items-center shadow-sm">
        <div className="pl-3 pr-2 text-zinc-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          defaultValue={buscaAtual}
          onChange={(e) => {
            // Um pequeno delay (debounce) na mão para não disparar 100 requisições
            setTimeout(() => handleBuscar(e.target.value), 400);
          }}
          placeholder="Pesquisar por nome, telefone ou placa..."
          className="w-full text-sm outline-none placeholder:text-zinc-400 text-zinc-900 bg-transparent py-2"
        />
      </div>

      {/* Tabela / Lista Alinhada */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Cabeçalho das Colunas */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5">Dados do Cliente</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-4">Veículos Vinculados</div>
        </div>

        {clientes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-500">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 flex-1">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => setClienteSelecionado(c)}
                className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors text-left items-center group"
              >
                {/* Avatar e Nome */}
                <div className="col-span-5 flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-sm shrink-0 border border-zinc-200 group-hover:border-[#E56B25] group-hover:text-[#E56B25] transition-colors">
                    {getIniciais(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-sm truncate">{c.nome}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.email || "Sem e-mail"}</p>
                  </div>
                </div>

                {/* Contato */}
                <div className="col-span-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-700">{c.telefone}</span>
                </div>

                {/* Veículos: Exibe no máximo 2, +X */}
                <div className="col-span-4 flex items-center gap-2 flex-wrap">
                  {c.veiculos && c.veiculos.length > 0 ? (
                    <>
                      {c.veiculos.slice(0, 2).map((v) => (
                        <div key={v.id} className="inline-flex items-center px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-600 gap-1.5 max-w-[140px]">
                          <span className="truncate">{v.modelo}</span>
                        </div>
                      ))}
                      {c.veiculos.length > 2 && (
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                          +{c.veiculos.length - 2}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-medium text-zinc-400">Nenhum veículo</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Rodapé: Paginação */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <button 
              disabled={paginaAtual === 1}
              onClick={() => mudarPagina(paginaAtual - 1)}
              className="px-3 py-1.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-md disabled:opacity-50 hover:bg-zinc-100"
            >
              Anterior
            </button>
            <span className="text-sm text-zinc-500 font-medium">Página {paginaAtual} de {totalPaginas}</span>
            <button 
              disabled={paginaAtual === totalPaginas}
              onClick={() => mudarPagina(paginaAtual + 1)}
              className="px-3 py-1.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-md disabled:opacity-50 hover:bg-zinc-100"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      <ModalClienteForm aberto={modalNovoAberto} onFechar={() => setModalNovoAberto(false)} onSalvo={handleAtualizado} />

      {clienteSelecionado && (
        <ModalClienteDetalhes
          cliente={clienteSelecionado}
          onFechar={() => setClienteSelecionado(null)}
          onAtualizado={handleAtualizado}
        />
      )}
    </div>
  );
}