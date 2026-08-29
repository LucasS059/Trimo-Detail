"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { autenticar } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await autenticar({ email, senha });
      router.push("/agenda");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setCarregando(false);
    }
  }

  const inputBaseClass = "w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-[#E56B25]/50 focus:border-[#E56B25] outline-none transition-all placeholder:text-zinc-400";
  const labelClass = "block text-sm font-bold text-zinc-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelClass}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputBaseClass}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-bold text-zinc-700">Senha</label>
          <a href="#" className="text-sm font-medium text-[#E56B25] hover:underline">Esqueceu a senha?</a>
        </div>
        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className={`${inputBaseClass} pr-12`}
            placeholder="Sua senha"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            {mostrarSenha ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19.5c-4.97 0-9.12-3.184-10.36-7.5a10.05 10.05 0 011.716-3.234m2.606-2.536A9.987 9.987 0 0112 4.5c4.97 0 9.12 3.184 10.36 7.5a10.05 10.05 0 01-1.716 3.234m-2.606 2.536L4.5 4.5m14.25 14.25L18 18m-4.5-4.5a3 3 0 00-4.5-4.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5.25 12 5.25c4.478 0 8.27 2.693 9.542 6.75-1.272 4.057-5.064 6.75-9.542 6.75-4.477 0-8.268-2.693-9.542-6.75z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl border border-red-100">
          {erro}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={carregando} 
        className="w-full bg-[#E56B25] hover:bg-[#cf5818] text-white font-bold py-6 mt-2 rounded-xl text-base shadow-lg shadow-[#E56B25]/20 transition-all"
      >
        {carregando ? "Entrando..." : "Entrar no painel"}
      </Button>
    </form>
  );
}