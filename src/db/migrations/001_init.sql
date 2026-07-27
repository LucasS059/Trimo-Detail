-- db/migrations/001_init.sql (Versão Definitiva Completa)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Loja = tenant. Cada estética automotiva cadastrada é uma linha aqui.
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  nome_dono TEXT,
  descricao TEXT,
  imagem_url TEXT,
  endereco TEXT,
  email_login TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,

  -- configurações de agendamento
  antecedencia_minima_minutos INTEGER NOT NULL DEFAULT 60,
  prazo_cancelamento_minutos INTEGER NOT NULL DEFAULT 60,
  lembrete_confirmacao_minutos INTEGER NOT NULL DEFAULT 60,
  dias_futuros_visiveis INTEGER NOT NULL DEFAULT 15,

  -- integração Mercado Pago
  mercadopago_access_token TEXT,
  mercadopago_user_id TEXT,

  -- plano/cobrança
  plano TEXT NOT NULL DEFAULT 'gratuito',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Horário de funcionamento por dia da semana (0 = domingo ... 6 = sábado)
CREATE TABLE horarios_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_abertura TIME NOT NULL,
  hora_fechamento TIME NOT NULL,
  fechado BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (loja_id, dia_semana)
);

-- Bloqueios manuais de horário
CREATE TABLE bloqueios_horario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loja_id, telefone)
);

CREATE TABLE veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa TEXT,
  modelo TEXT NOT NULL,
  cor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  servico_id UUID NOT NULL REFERENCES servicos(id),

  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,

  status TEXT NOT NULL DEFAULT 'agendado' CHECK (
    status IN ('agendado', 'em_andamento', 'aguardando_pagamento', 'concluido', 'cancelado', 'nao_compareceu')
  ),

  presenca_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  cancelado_por TEXT CHECK (cancelado_por IN ('cliente', 'dono')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agendamentos_loja_data ON agendamentos (loja_id, data_hora);

CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  forma TEXT NOT NULL CHECK (forma IN ('pix', 'point', 'manual')),
  forma_manual_detalhe TEXT,
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'falhou')),
  mercadopago_payment_id TEXT,
  qr_code_base64 TEXT,
  copia_e_cola TEXT,
  expira_em TIMESTAMPTZ,
  confirmado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagamentos_agendamento ON pagamentos (agendamento_id);