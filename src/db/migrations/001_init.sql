CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ==========================================
-- DOMÍNIO 1: LOJA (VITRINE E IDENTIDADE)
-- ==========================================
CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL UNIQUE, 
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  endereco TEXT,
  fuso_horario VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  cor_primaria VARCHAR(7) NOT NULL DEFAULT '#E56B25',
  ultimo_upload_imagem_at TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT TRUE, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 2: AUTENTICAÇÃO E USUÁRIOS DA LOJA
-- ==========================================
CREATE TABLE IF NOT EXISTS loja_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email_login TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'dono' CHECK (cargo IN ('dono', 'funcionario', 'admin')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 3: CONFIGURAÇÕES DE REGRAS DE NEGÓCIO
-- ==========================================
CREATE TABLE IF NOT EXISTS loja_configuracoes_agenda (
  loja_id UUID PRIMARY KEY REFERENCES lojas(id) ON DELETE CASCADE,
  antecedencia_minima_minutos INTEGER NOT NULL DEFAULT 60,
  prazo_cancelamento_minutos INTEGER NOT NULL DEFAULT 60,
  lembrete_confirmacao_minutos INTEGER NOT NULL DEFAULT 60,
  dias_futuros_visiveis INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 4: INTEGRAÇÕES E SEGREDOS
-- ==========================================
CREATE TABLE IF NOT EXISTS loja_integracoes (
  loja_id UUID PRIMARY KEY REFERENCES lojas(id) ON DELETE CASCADE,
  mercadopago_access_token TEXT,
  mercadopago_user_id TEXT,
  mercadopago_device_id TEXT,
  taxa_debito_percentual NUMERIC(5,2) NOT NULL DEFAULT 1.99,
  taxa_credito_percentual NUMERIC(5,2) NOT NULL DEFAULT 4.98,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 5: ASSINATURAS DO SISTEMA (PLANO)
-- ==========================================
CREATE TABLE IF NOT EXISTS loja_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  plano TEXT NOT NULL DEFAULT 'gratuito',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inadimplente', 'cancelado', 'trial')),
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  gateway_assinatura_id TEXT, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 6: HORÁRIOS E BLOQUEIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS loja_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_abertura TIME NOT NULL,
  hora_fechamento TIME NOT NULL,
  fechado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loja_id, dia_semana)
);

CREATE TABLE IF NOT EXISTS loja_bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  inicio TIMESTAMPTZ NOT NULL,
  fim TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 7: CLIENTES E VEÍCULOS
-- ==========================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL UNIQUE, 
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loja_id, telefone)
);

CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa TEXT,
  modelo TEXT NOT NULL,
  cor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 8: CATÁLOGO DE SERVIÇOS
-- ==========================================
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL UNIQUE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 9: OPERAÇÃO (AGENDAMENTOS E PAGAMENTOS)
-- ==========================================
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL UNIQUE, 
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT, 
  veiculo_id UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (
    status IN ('agendado', 'em_andamento', 'aguardando_pagamento', 'concluido', 'cancelado', 'nao_compareceu')
  ),
  presenca_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  cancelado_por TEXT CHECK (cancelado_por IN ('cliente', 'dono', 'funcionario', 'admin')),
  observacoes TEXT,
  atualizado_por_usuario_id UUID REFERENCES loja_usuarios(id) ON DELETE SET NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agendamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT, 
  nome_servico TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL UNIQUE,
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  forma TEXT NOT NULL CHECK (forma IN ('pix', 'point', 'manual')),
  forma_manual_detalhe JSONB, 
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'falhou')),
  mercadopago_payment_id TEXT UNIQUE, 
  confirmado_em TIMESTAMPTZ,
  qr_code_base64 TEXT,
  copia_e_cola TEXT,
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- DOMÍNIO 10: SEGURANÇA E INFRAESTRUTURA
-- ==========================================
CREATE TABLE IF NOT EXISTS auth_codigos (
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

-- ==========================================
-- ÍNDICES DE PERFORMANCE E REGRAS DE INTEGRIDADE
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS lojas_email_login_key ON loja_usuarios (email_login); 
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_mp_payment_id ON pagamentos (mercadopago_payment_id) WHERE (mercadopago_payment_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_agendamentos_loja_data ON agendamentos (loja_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON agendamentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_itens_agendamento ON agendamento_itens (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_auth_codigos_contato ON auth_codigos (contato, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento ON pagamentos (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo);
CREATE INDEX IF NOT EXISTS idx_agendamentos_codigo ON agendamentos(codigo);

CREATE INDEX IF NOT EXISTS idx_clientes_ativos ON clientes(loja_id) WHERE ativo = true; 
CREATE INDEX IF NOT EXISTS idx_servicos_ativos ON servicos(loja_id) WHERE ativo = true; 

-- ==========================================
-- GIST: PREVENÇÃO DE OVERBOOKING NATIVA
-- ==========================================
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sem_conflito_horario'
  ) THEN
    ALTER TABLE agendamentos
      ADD CONSTRAINT sem_conflito_horario
      EXCLUDE USING gist (
        loja_id WITH =,
        tstzrange(data_hora, data_fim, '[)') WITH &&
      )
      WHERE (status <> 'cancelado');
  END IF;
END $do$;