import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-6 selection:bg-[#E56B25] selection:text-white">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <span className="text-3xl font-black text-[#E56B25]">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-sm text-zinc-400 font-medium leading-relaxed">
            O endereço que você tentou acessar não existe, foi alterado ou a estética não está disponível no momento.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#E56B25] hover:bg-[#cf5818] text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-[#E56B25]/20 text-center"
          >
            Ir para a Página Inicial
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl transition-colors text-sm text-center"
          >
            Acessar Painel
          </Link>
        </div>

        <div className="pt-8 border-t border-zinc-900">
          <p className="text-xs text-zinc-600 font-mono">
            Trimo Detail — Sistema de Gestão para Estéticas Automotivas
          </p>
        </div>
      </div>
    </div>
  );
}
