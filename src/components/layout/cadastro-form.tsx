"use client";
// components/layout/cadastro-form.tsx

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cadastrarLoja, slugDisponivel } from "@/lib/actions/cadastro";

function normalizarSlugVisual(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CadastroForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [nomeDono, setNomeDono] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [statusSlug, setStatusSlug] = useState<"idle" | "checando" | "livre" | "ocupado">(
    "idle"
  );

  function handleNomeChange(valor: string) {
    setNome(valor);
    if (!slugEditadoManualmente) {
      setSlug(normalizarSlugVisual(valor));
    }
  }

  function handleSlugChange(valor: string) {
    setSlugEditadoManualmente(true);
    setSlug(normalizarSlugVisual(valor));
    setStatusSlug("idle");
  }

  async function checarSlug() {
    if (!slug) return;
    setStatusSlug("checando");
    const disponivel = await slugDisponivel(slug);
    setStatusSlug(disponivel ? "livre" : "ocupado");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await cadastrarLoja({
          nome,
          slug,
          nomeDono,
          emailLogin: email,
          senha,
        });
        router.push("/agenda");
        void resultado;
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível criar a loja");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome da loja</label>
        <input
          value={nome}
          onChange={(e) => handleNomeChange(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Ex: João Detail Automotivo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link público</label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500 whitespace-nowrap">trimodetail.com/</span>
          <input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={checarSlug}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {statusSlug === "checando" && (
          <p className="text-xs text-gray-400 mt-1">Verificando disponibilidade...</p>
        )}
        {statusSlug === "livre" && (
          <p className="text-xs text-green-600 mt-1">Link disponível</p>
        )}
        {statusSlug === "ocupado" && (
          <p className="text-xs text-red-600 mt-1">Esse link já está em uso, escolha outro</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Seu nome (dono)</label>
        <input
          value={nomeDono}
          onChange={(e) => setNomeDono(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">E-mail de login</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <div className="relative">
          <input
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
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

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando..." : "Criar minha loja"}
      </Button>
    </form>
  );
}
