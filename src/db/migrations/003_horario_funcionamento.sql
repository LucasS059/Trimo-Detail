CREATE TABLE horarios_funcionamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda ... 6=Sábado
  hora_abertura TIME NOT NULL,
  hora_fechamento TIME NOT NULL,
  fechado BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (loja_id, dia_semana)
);