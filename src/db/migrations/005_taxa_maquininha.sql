ALTER TABLE lojas 
  ADD COLUMN taxa_debito_percentual NUMERIC(5, 2) NOT NULL DEFAULT 1.99,
  ADD COLUMN taxa_credito_percentual NUMERIC(5, 2) NOT NULL DEFAULT 4.98;