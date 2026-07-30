-- db/migrations/011_prevenir_conflito_agendamentos.sql
-- Impede, a nível de banco, que dois agendamentos da mesma loja se sobreponham no tempo.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Coluna real (não gerada) com o fim do agendamento, preenchida pela aplicação no INSERT.
ALTER TABLE agendamentos ADD COLUMN data_fim TIMESTAMPTZ;

-- Popula os registros existentes a partir de duracao_minutos.
UPDATE agendamentos SET data_fim = data_hora + (duracao_minutos * interval '1 minute');

ALTER TABLE agendamentos ALTER COLUMN data_fim SET NOT NULL;

-- Nenhum agendamento ativo (não cancelado) pode sobrepor outro da mesma loja.
-- tstzrange(timestamptz, timestamptz) é IMMUTABLE — sem soma de interval no meio, sem problema.
ALTER TABLE agendamentos
  ADD CONSTRAINT sem_conflito_horario
  EXCLUDE USING gist (
    loja_id WITH =,
    tstzrange(data_hora, data_fim, '[)') WITH &&
  )
  WHERE (status <> 'cancelado');

-- Down Migration

ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS sem_conflito_horario;
ALTER TABLE agendamentos DROP COLUMN IF EXISTS data_fim;