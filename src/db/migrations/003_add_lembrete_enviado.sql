-- Migration 003: Adiciona controle de disparo de lembrete
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS lembrete_enviado BOOLEAN NOT NULL DEFAULT FALSE;

