"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { salvarConfiguracoesAction } from "@/lib/actions/configuracoes";

type Loja = {
  nome: string;
  slug: string;
  nome_dono: string | null;
  descricao: string | null;
  imagem_url: string | null;
  endereco: string | null;
  antecedencia_minima_minutos: number;
  prazo_cancelamento_minutos: number;
  lembrete_confirmacao_minutos: number;
  dias_futuros_visiveis: number;
  mercadopago_user_id: string | null;
  tem_mercadopago_configurado: boolean;
};

export function ConfiguracoesForm({ loja }: { loja: Loja }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...loja, mercadopago_access_token: "" });
  const [salvo, setSalvo] = useState(false);

  function campo<K extends keyof typeof form>(chave: K, valor: (typeof form)[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    setSalvo(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await salvarConfiguracoesAction(form);
      setForm((atual) => ({ ...atual, mercadopago_access_token: "" })); // limpa o campo sensível após salvar
      setSalvo(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome da loja</label>
        <input
          value={form.nome}
          onChange={(e) => campo("nome", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link público</label>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>trimodetail.com/</span>
          <input
            value={form.slug}
            onChange={(e) => campo("slug", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nome do dono</label>
        <input
          value={form.nome_dono ?? ""}
          onChange={(e) => campo("nome_dono", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          value={form.descricao ?? ""}
          onChange={(e) => campo("descricao", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Endereço</label>
        <input
          value={form.endereco ?? ""}
          onChange={(e) => campo("endereco", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Integração Mercado Pago</h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Access Token</label>
            <input
              type="password"
              value={form.mercadopago_access_token}
              onChange={(e) => campo("mercadopago_access_token", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder={
                form.tem_mercadopago_configurado
                  ? "•••••••••••• (configurado — digite para alterar)"
                  : "APP_USR-..."
              }
            />
            {form.tem_mercadopago_configurado && (
              <p className="text-xs text-gray-500 mt-1">
                Já existe um token salvo. Deixe em branco para mantê-lo.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User ID (Opcional)</label>
            <input
              value={form.mercadopago_user_id ?? ""}
              onChange={(e) => campo("mercadopago_user_id", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: 123456789"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Regras de Agendamento</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Antecedência mínima (minutos)</label>
            <input
              type="number"
              value={form.antecedencia_minima_minutos}
              onChange={(e) => campo("antecedencia_minima_minutos", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prazo de cancelamento (minutos)</label>
            <input
              type="number"
              value={form.prazo_cancelamento_minutos}
              onChange={(e) => campo("prazo_cancelamento_minutos", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lembrete de presença (minutos antes)</label>
            <input
              type="number"
              value={form.lembrete_confirmacao_minutos}
              onChange={(e) => campo("lembrete_confirmacao_minutos", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dias futuros visíveis</label>
            <input
              type="number"
              value={form.dias_futuros_visiveis}
              onChange={(e) => campo("dias_futuros_visiveis", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar configurações"}
        </Button>
        {salvo && <span className="text-sm text-green-600">Salvo com sucesso</span>}
      </div>
    </form>
  );
}