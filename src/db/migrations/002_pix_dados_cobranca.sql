ALTER TABLE pagamentos
  ADD COLUMN qr_code_base64 TEXT,
  ADD COLUMN copia_e_cola TEXT,
  ADD COLUMN expira_em TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_pagamentos_mp_payment_id
  ON pagamentos (mercadopago_payment_id)
  WHERE mercadopago_payment_id IS NOT NULL;

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();