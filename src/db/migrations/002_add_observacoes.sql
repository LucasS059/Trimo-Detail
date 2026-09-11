-- Migration 002: Adiciona campo de observações ao agendamento
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

