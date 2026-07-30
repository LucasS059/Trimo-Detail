CREATE TABLE codigos_verificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('whatsapp', 'email')),
  codigo text NOT NULL,
  tentativas int NOT NULL DEFAULT 0,
  expira_em timestamptz NOT NULL,
  usado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_codigos_verificacao_contato ON codigos_verificacao (contato, created_at DESC);
CREATE INDEX idx_agendamentos_cliente_id ON agendamentos (cliente_id);