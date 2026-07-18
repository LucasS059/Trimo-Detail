# Trimo Detail

Sistema de gestão e agendamento para estéticas automotivas. Parte da família de produtos **Trimo**.

## O que é

Painel para o dono de uma estética automotiva gerenciar agenda, clientes, serviços e financeiro, além de uma página pública onde o cliente final agenda um horário sozinho, sem precisar de login.

Documentação detalhada do produto (funcionalidades, fluxos e regras de negócio) em [`docs/sistema-estetica-automotiva.docx`](./docs/sistema-estetica-automotiva.docx).

**Protótipo base:** [prototipo-esteticaauto.lovable.app](https://prototipo-esteticaauto.lovable.app)

## Stack

- **Next.js** (App Router) — front-end e back-end (API Routes / Server Actions)
- **PostgreSQL** — banco de dados, acessado com SQL puro via [`pg`](https://node-postgres.com/) (sem ORM)
- **node-pg-migrate** — controle de migrations via arquivos `.sql` versionados
- **Mercado Pago SDK** — pagamentos via Pix e Point
- **WhatsApp API** — notificações automáticas (provedor a definir)
- **Docker** — apenas para o PostgreSQL em ambiente local
- **Vercel** — deploy

## Rodando localmente

### Pré-requisitos
- Node.js 20+
- Docker Desktop

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Subir o banco de dados local
docker compose up -d

# 3. Copiar variáveis de ambiente
cp .env.example .env.local

# 4. Rodar migrations
npm run migrate:up

# 5. Iniciar o projeto
npm run dev
```

O projeto sobe em `http://localhost:3000`.

Para derrubar o banco:
```bash
docker compose down
```

Para resetar o banco do zero (apaga os dados):
```bash
docker compose down -v
docker compose up -d
npm run migrate:up
```

## Acessando o banco de dados

O `docker-compose.yml` sobe dois serviços: o Postgres em si e o **Adminer**, uma interface web leve para consultar e editar dados sem precisar instalar nada além do Docker.

### Interface web (Adminer)

Com `docker compose up -d` rodando, acesse `http://localhost:8080` e preencha:

| Campo | Valor |
|---|---|
| Sistema | PostgreSQL |
| Servidor | `postgres` |
| Usuário | `postgres` |
| Senha | `postgres` |
| Base de dados | `trimo_detail` |

> O campo "Servidor" usa o nome do serviço (`postgres`), não `localhost` — o Adminer acessa o banco pela rede interna do Docker Compose.

### DBeaver

Pra conectar pelo DBeaver (fora do Docker, direto na porta exposta):

1. **Nova conexão** → `PostgreSQL`
2. Preencha:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `trimo_detail` |
| Username | `postgres` |
| Password | `postgres` |

3. Em **Save password**, marque a opção pra não digitar toda vez
4. Clique em **Test Connection** — se pedir para baixar o driver PostgreSQL na primeira vez, aceite
5. **Finish**

String de conexão equivalente, se preferir colar direto:
```
postgresql://postgres:postgres@localhost:5432/trimo_detail
```

### Acesso via terminal (psql dentro do container)

```bash
docker exec -it trimo-detail-db psql -U postgres -d trimo_detail
```

## Estrutura do projeto

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
│   │   ├── client.ts            # conexão com o Postgres (Pool)
│   │   ├── agendamentos.ts
│   │   ├── clientes.ts
│   │   ├── servicos.ts
│   │   └── pagamentos.ts
│   ├── mercadopago/
│   ├── whatsapp/
│   └── slots.ts                 # cálculo de horários livres
├── db/
│   └── migrations/              # arquivos .sql versionados
├── components/
├── docs/
│   └── sistema-estetica-automotiva.docx
├── docker-compose.yml
└── README.md
```

## Modelo de negócio

Produto SaaS multi-tenant: cada estética automotiva é um tenant próprio, com sua página pública, configurações e integração de pagamento independentes. Plano pago (~R$30/mês por loja), com o primeiro cliente em cortesia durante a fase de validação.

## Status

🚧 Em desenvolvimento — fase de definição de modelo de dados e estrutura inicial.
