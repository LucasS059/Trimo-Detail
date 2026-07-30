// components/public/loja/loja-publica-header.tsx
import Link from "next/link";

type Loja = {
  slug: string;
  nome: string;
  nome_dono: string | null;
  descricao: string | null;
  imagem_url: string | null;
};

export function LojaPublicaHeader({ loja, brand }: { loja: Loja; brand: string }) {
  const iniciais = loja.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-end mb-4">
        <Link
          href={`/${loja.slug}/meus-agendamentos`}
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          Meus agendamentos
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {loja.imagem_url ? (
          <img
            src={loja.imagem_url}
            alt={loja.nome}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-zinc-800 shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black text-white shrink-0"
            style={{ backgroundColor: brand }}
          >
            {iniciais || "?"}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight truncate">
            {loja.nome}
          </h1>
          {loja.nome_dono && (
            <p className="text-xs font-medium text-zinc-500 mt-0.5 truncate">por {loja.nome_dono}</p>
          )}
        </div>
      </div>

      {loja.descricao && (
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{loja.descricao}</p>
      )}
    </div>
  );
}