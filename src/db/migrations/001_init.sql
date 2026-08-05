CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  nome_dono TEXT,
  descricao TEXT,
  imagem_url TEXT,
  endereco TEXT,
  email_login TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  antecedencia_minima_minutos INTEGER NOT NULL DEFAULT 60,
  prazo_cancelamento_minutos INTEGER NOT NULL DEFAULT 60,
  lembrete_confirmacao_minutos INTEGER NOT NULL DEFAULT 60,
  dias_futuros_visiveis INTEGER NOT NULL DEFAULT 15,
  mercadopago_access_token TEXT,
  mercadopago_user_id TEXT,
  plano TEXT NOT NULL DEFAULT 'gratuito',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  mercadopago_device_id TEXT,
  taxa_debito_percentual NUMERIC(5,2) NOT NULL DEFAULT 1.99,
  taxa_credito_percentual NUMERIC(5,2) NOT NULL DEFAULT 4.98,
  fuso_horario VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  cor_primaria VARCHAR(7) NOT NULL DEFAULT '#E56B25',
  ultimo_upload_imagem_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE horarios_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_abertura TIME NOT NULL,
  hora_fechamento TIME NOT NULL,
  fechado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loja_id, dia_semana)
);

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
  data_hora TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
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

CREATE TABLE agendamento_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id),
  nome_servico TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  forma TEXT NOT NULL CHECK (forma IN ('pix', 'point', 'manual')),
  forma_manual_detalhe TEXT,
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'falhou')),
  mercadopago_payment_id TEXT,
  confirmado_em TIMESTAMPTZ,
  qr_code_base64 TEXT,
  copia_e_cola TEXT,
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE codigos_verificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email')),
  codigo TEXT NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 0,
  expira_em TIMESTAMPTZ NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tentativas_envio INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX clientes_loja_id_telefone_key ON clientes (loja_id, telefone);
CREATE UNIQUE INDEX lojas_slug_key ON lojas (slug);
CREATE UNIQUE INDEX lojas_email_login_key ON lojas (email_login);
CREATE UNIQUE INDEX horarios_funcionamento_loja_id_dia_semana_key ON horarios_funcionamento (loja_id, dia_semana);
CREATE UNIQUE INDEX idx_pagamentos_mp_payment_id ON pagamentos (mercadopago_payment_id) WHERE (mercadopago_payment_id IS NOT NULL);

CREATE INDEX idx_agendamentos_loja_data ON agendamentos (loja_id, data_hora);
CREATE INDEX idx_agendamentos_cliente_id ON agendamentos (cliente_id);
CREATE INDEX idx_agendamento_servicos_agendamento ON agendamento_servicos (agendamento_id);
CREATE INDEX idx_codigos_verificacao_contato ON codigos_verificacao (contato, created_at DESC);
CREATE INDEX idx_pagamentos_agendamento ON pagamentos (agendamento_id);

ALTER TABLE agendamentos
  ADD CONSTRAINT sem_conflito_horario
  EXCLUDE USING gist (
    loja_id WITH =,
    tstzrange(data_hora, data_fim, '[)') WITH &&
  )
  WHERE (status <> 'cancelado');
