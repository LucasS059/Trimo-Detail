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
  
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // NOVO: Sincroniza o modal aberto com os dados mais frescos vindos do servidor
  useEffect(() => {
    if (clienteSelecionado) {
      const clienteAtualizado = clientes.find((c) => c.id === clienteSelecionado.id);
      if (clienteAtualizado) {
        setClienteSelecionado(clienteAtualizado);
      } else {
        // Se não encontrar o cliente (ex: foi excluído), fecha o modal
        setClienteSelecionado(null);
      }
    }
  }, [clientes]);

  function handleAtualizado() {
    setModalNovoAberto(false);
    // Removemos o setClienteSelecionado(null) daqui para não forçar o fechamento!
    router.refresh();
  }

  function handleBuscar(termo: string) {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (termo) {
      params.set("busca", termo);
    } else {
      params.delete("busca");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

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
          <h1 className="text-2xl font-black text-white tracking-tight">Clientes</h1>
          <p className="text-sm font-medium text-zinc-400 mt-0.5">
            {totalClientes} clientes na sua base
          </p>
        </div>
        <button 
          onClick={() => setModalNovoAberto(true)}
          className="px-5 py-2.5 rounded-xl bg-[#E56B25] hover:bg-[#cf5818] text-white text-sm font-bold transition-colors shadow-sm shadow-[#E56B25]/20 flex items-center justify-center gap-2"
        >
          <span>+</span> Novo Cliente
        </button>
      </div>

      {/* Barra de Busca Server-Side */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 flex items-center shadow-sm focus-within:border-[#E56B25] focus-within:ring-1 focus-within:ring-[#E56B25] transition-all">
        <div className="pl-3 pr-2 text-zinc-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          defaultValue={buscaAtual}
          onChange={(e) => setTimeout(() => handleBuscar(e.target.value), 400)}
          placeholder="Pesquisar por nome, telefone ou placa..."
          className="w-full text-sm outline-none placeholder:text-zinc-500 text-white bg-transparent py-2"
        />
      </div>

      {/* Tabela / Lista Alinhada */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Cabeçalho das Colunas */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5">Dados do Cliente</div>
          <div className="col-span-3">Contato</div>
          <div className="col-span-4">Veículos Vinculados</div>
        </div>

        {clientes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-500">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 flex-1">
            {clientes.map((c) => (
              <div
                key={c.id}
                onClick={() => setClienteSelecionado(c)}
                className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors text-left items-center group cursor-pointer"
              >
                {/* Avatar e Nome */}
                <div className="col-span-5 flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm shrink-0 border border-zinc-700 group-hover:border-[#E56B25] group-hover:text-[#E56B25] transition-colors">
                    {getIniciais(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{c.nome}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.email || "Sem e-mail"}</p>
                  </div>
                </div>

                {/* Contato (Com Botão Rápido WhatsApp) */}
                <div className="col-span-3 flex items-center justify-between md:justify-start gap-3">
                  <span className="text-sm font-mono font-medium text-zinc-300">{c.telefone}</span>
                  
                  <a
                    href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-zinc-500 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                    title="Chamar no WhatsApp"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </a>
                </div>

                {/* Veículos */}
                <div className="col-span-4 flex items-center gap-2 flex-wrap">
                  {c.veiculos && c.veiculos.length > 0 ? (
                    <>
                      {c.veiculos.slice(0, 2).map((v) => (
                        <div key={v.id} className="inline-flex items-center px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-300 gap-1.5 max-w-[140px] uppercase">
                          <span className="truncate">{v.modelo}</span>
                          {v.placa && <span className="font-mono text-zinc-500">· {v.placa}</span>}
                        </div>
                      ))}
                      {c.veiculos.length > 2 && (
                        <span className="text-[11px] font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                          +{c.veiculos.length - 2}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs font-medium text-zinc-600">Nenhum veículo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé: Paginação */}
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