-- db/migrations/XXXXXX_multi_servico_agendamento.sql

-- Nova tabela: cada linha é um serviço dentro de um agendamento,
-- com preço e duração "congelados" no momento da criação
-- (mesmo padrão de snapshot que já existia em agendamentos.valor)
CREATE TABLE "agendamento_servicos" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "agendamento_id" uuid NOT NULL,
    "servico_id" uuid NOT NULL,
    "nome_servico" text NOT NULL,
    "preco" numeric(10,2) NOT NULL,
    "duracao_minutos" integer NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "agendamento_servicos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "agendamento_servicos_agendamento_id_fkey"
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
    CONSTRAINT "agendamento_servicos_servico_id_fkey"
        FOREIGN KEY (servico_id) REFERENCES servicos(id)
);

CREATE INDEX idx_agendamento_servicos_agendamento
    ON agendamento_servicos USING btree (agendamento_id);

-- Migra os dados existentes: cada agendamento atual (1 serviço) vira
-- 1 linha na nova tabela, preservando o histórico
INSERT INTO agendamento_servicos (agendamento_id, servico_id, nome_servico, preco, duracao_minutos)
SELECT a.id, a.servico_id, s.nome, a.valor, a.duracao_minutos
FROM agendamentos a
JOIN servicos s ON s.id = a.servico_id;

-- Remove a coluna antiga de serviço único.
-- agendamentos.valor e agendamentos.duracao_minutos PERMANECEM —
-- agora representam o TOTAL agregado do agendamento (soma dos serviços),
-- calculado no código toda vez que o agendamento é criado.
ALTER TABLE agendamentos DROP CONSTRAINT agendamentos_servico_id_fkey;
ALTER TABLE agendamentos DROP COLUMN servico_id;