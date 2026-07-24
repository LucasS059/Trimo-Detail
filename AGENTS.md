# AGENTS.md

Guia de contexto e convenções do projeto **Trimo Detail**, para uso por agentes de IA (Claude Code, Cursor, Copilot, etc.) ao trabalhar neste repositório.

## Visão geral do projeto

Sistema de agendamento e gestão para estéticas automotivas. Parte da família de produtos **Trimo**. SaaS multi-tenant: cada estética é um tenant próprio, com página pública, configurações e integração de pagamento independentes.

Documentação de produto completa em `docs/sistema-estetica-automotiva.docx`. Consulte esse arquivo antes de implementar qualquer regra de negócio nova — ele é a fonte de verdade sobre fluxos, status de agendamento e regras de cancelamento.

## Stack

- **Next.js** (App Router) — TypeScript, Tailwind CSS
- **PostgreSQL** — acesso via SQL puro com [`pg`](https://node-postgres.com/), **sem ORM** (não usar Prisma, Drizzle, TypeORM ou similar)
- **node-pg-migrate** — migrations como arquivos `.sql` versionados em `db/migrations/`
- **Mercado Pago SDK** — pagamentos (Pix e Point)
- **WhatsApp API** — notificações automáticas (provedor a definir)
- **Docker** — apenas para rodar o PostgreSQL localmente (não usar Docker para rodar o Next.js em dev)
- **Vercel** — deploy

## Convenções de código

### Estrutura de rotas (App Router)
Cada pasta em `app/` é uma rota; `page.tsx` é o conteúdo da rota; `layout.tsx` envolve as páginas daquela pasta. Grupos de rotas usam parênteses, ex: `(admin)/`, `(public)/`, e não entram na URL.

### Componentização
`page.tsx` deve ficar enxuto — apenas monta a tela chamando componentes de `components/`. Lógica de UI, estado e apresentação ficam nos componentes, não na página.

```tsx
// app/agenda/page.tsx
import { AgendaHeader } from "@/components/agenda/agenda-header";
import { AgendaLista } from "@/components/agenda/agenda-lista";

export default function AgendaPage() {
  return (
    <main>
      <AgendaHeader />
      <AgendaLista />
    </main>
  );
}
```

### Acesso a dados
Queries SQL ficam isoladas em `lib/db/*.ts`, um arquivo por entidade (`agendamentos.ts`, `clientes.ts`, `servicos.ts`, `pagamentos.ts`). Nunca escrever SQL direto dentro de componentes ou rotas de API — sempre importar da camada `lib/db`.

### Nomenclatura
- Arquivos e pastas: `kebab-case`
- Componentes React: `PascalCase` no nome do componente, arquivo em `kebab-case` (ex: `agenda-header.tsx` exporta `AgendaHeader`)
- Variáveis e funções: `camelCase`
- Tabelas e colunas do banco: `snake_case`, em português (ex: `agendamentos`, `cliente_id`, `forma_pagamento`)

## Estrutura de pastas

```
trimo-detail/
├── app/
│   ├── (public)/
│   │   └── [slug]/              # página pública da loja
│   ├── (admin)/
│   │   ├── login/
│   │   ├── agenda/
│   │   ├── clientes/
│   │   ├── servicos/
│   │   ├── financeiro/
│   │   └── configuracoes/
│   └── api/
│       ├── mercadopago/webhook/
│       └── whatsapp/
├── lib/
│   ├── db/
│   │   ├── client.ts             # conexão com o Postgres (Pool)
│   │   ├── agendamentos.ts
│   │   ├── clientes.ts
│   │   ├── servicos.ts
│   │   └── pagamentos.ts
│   ├── mercadopago/
│   ├── whatsapp/
│   └── slots.ts                  # cálculo de horários livres
├── db/
│   └── migrations/                # arquivos .sql versionados
├── components/
└── docs/
    └── sistema-estetica-automotiva.docx
```

## Regras de negócio que o agente deve conhecer

- **Status do agendamento:** `Agendado → Em andamento → Aguardando pagamento → Concluído`, além de `Cancelado` e `Não compareceu`. O status `Concluído` só é atingido quando o serviço está pronto **e** o pagamento confirmado — nunca marcar como concluído automaticamente só por um dos dois critérios.
- **Pagamento:** três formas — Pix (QR via Mercado Pago, confirmação automática por webhook), maquininha Point (confirmação automática), e baixa manual (sempre disponível como fallback, independente da forma escolhida).
- **Cancelamento:** o cliente pode cancelar o próprio agendamento pelo link público, até 1 hora antes do horário (prazo configurável pelo dono). Não existe remarcação como ação própria — é cancelar e criar um novo agendamento.
- **Notificações:** o cliente recebe WhatsApp automático a cada mudança de status, e um lembrete de confirmação de presença antes do horário (tempo configurável). O dono pode disparar esse lembrete manualmente a qualquer momento.
- **Multi-tenant:** todo dado (agendamentos, clientes, serviços, configurações) é isolado por loja/tenant. Nunca escrever uma query que não filtre pelo tenant correspondente.

## O que evitar

- Não introduzir ORM (Prisma, Drizzle) — o projeto usa SQL puro deliberadamente
- Não usar `localStorage`/`sessionStorage` como fonte de verdade de dados de negócio
- Não misturar lógica de acesso a dados dentro de componentes de UI
- Não criar múltiplos usuários por loja nesta fase — v1 é admin único por tenant
- Não implementar "remarcar" como fluxo separado de cancelamento + novo agendamento

## Comandos úteis

```bash
npm run dev              # inicia o Next.js em desenvolvimento
docker compose up -d     # sobe Postgres + Adminer
docker compose down      # derruba os containers
npm run migrate:up       # aplica migrations pendentes
```