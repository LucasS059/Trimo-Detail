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
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando..." : "Criar minha loja"}
      </Button>
    </form>
  );
}
