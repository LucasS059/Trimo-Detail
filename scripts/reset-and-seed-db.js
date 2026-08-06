const { readFileSync } = require("node:fs");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Erro: DATABASE_URL não está definido.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    console.log("🔄 Resetando o banco de dados...");
    await client.query("DROP SCHEMA public CASCADE;");
    await client.query("CREATE SCHEMA public;");

    const sql = readFileSync("src/db/migrations/001_init.sql", "utf8");
    await client.query(sql);
    console.log("✅ Esquema recriado a partir de src/db/migrations/001_init.sql.");

    console.log("🧪 Inserindo dados de teste (Arquitetura Enterprise)...");

    const senhaHash = await bcrypt.hash("Lucas2312", 10);

    // ==========================================
    // 1. DOMÍNIOS DA LOJA (Estrutura Fatiada)
    // ==========================================
    const lojaResult = await client.query(
      `INSERT INTO lojas (nome, slug, descricao, endereco)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        "Loja de Teste",
        "loja-teste",
        "Loja criada para testes automáticos.",
        "Rua do Teste, 123",
      ]
    );
    const lojaId = lojaResult.rows[0].id;

    await client.query(
      `INSERT INTO loja_usuarios (loja_id, nome, email_login, senha_hash, cargo)
       VALUES ($1, $2, $3, $4, $5)`,
      [lojaId, "Proprietário Teste", "dev.lucas.silva59@gmail.com", senhaHash, "dono"]
    );

    await client.query(
      `INSERT INTO loja_configuracoes_agenda (loja_id) VALUES ($1)`,
      [lojaId] // Usará os defaults
    );

    await client.query(
      `INSERT INTO loja_integracoes (loja_id) VALUES ($1)`,
      [lojaId] // Usará os defaults
    );

    await client.query(
      `INSERT INTO loja_assinaturas (loja_id, plano, status) VALUES ($1, $2, $3)`,
      [lojaId, "premium", "ativo"]
    );

    // Horários (Domingo = fechado)
    for (let dia = 0; dia <= 6; dia += 1) {
      await client.query(
        `INSERT INTO loja_horarios (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, $3, $4, $5)`,
        [lojaId, dia, "08:00", "18:00", dia === 0]
      );
    }

    // ==========================================
    // 2. CLIENTES E VEÍCULOS
    // ==========================================
    const cliente1Result = await client.query(
      `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
      [lojaId, "João Cliente (Concluído)", "+5511999999999", "joao@teste.com"]
    );
    const cliente1Id = cliente1Result.rows[0].id;

    const veiculo1Result = await client.query(
      `INSERT INTO veiculos (cliente_id, placa, modelo, cor) VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente1Id, "ABC1234", "Civic G10", "Preto"]
    );
    const veiculo1Id = veiculo1Result.rows[0].id;

    const cliente2Result = await client.query(
      `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
      [lojaId, "Maria Cliente (Futuro)", "+5511888888888", "maria@teste.com"]
    );
    const cliente2Id = cliente2Result.rows[0].id;

    const veiculo2Result = await client.query(
      `INSERT INTO veiculos (cliente_id, placa, modelo, cor) VALUES ($1, $2, $3, $4) RETURNING id`,
      [cliente2Id, "XYZ9876", "Corolla", "Branco"]
    );
    const veiculo2Id = veiculo2Result.rows[0].id;

    // ==========================================
    // 3. CATÁLOGO DE SERVIÇOS
    // ==========================================
    const servico1Result = await client.query(
      `INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [lojaId, "Polimento Completo", "Polimento automotivo completo com proteção.", 320.0, 120]
    );
    const servico1Id = servico1Result.rows[0].id;

    const servico2Result = await client.query(
      `INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [lojaId, "Lavagem Detalhada", "Lavagem técnica minuciosa.", 150.0, 60]
    );
    const servico2Id = servico2Result.rows[0].id;

    // ==========================================
    // 4. AGENDAMENTOS E PAGAMENTOS DINÂMICOS
    // ==========================================

    // ---> AGENDAMENTO 1: Passado, Concluído e Pago (Gera dados no Dashboard Financeiro)
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    ontem.setHours(10, 0, 0, 0);
    const ontemFim = new Date(ontem.getTime() + 60 * 60 * 1000);

    const agendamento1Result = await client.query(
      `INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [lojaId, cliente1Id, veiculo1Id, ontem.toISOString(), ontemFim.toISOString(), 60, 150.0, "concluido", true]
    );
    const agendamento1Id = agendamento1Result.rows[0].id;

    await client.query(
      `INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5)`,
      [agendamento1Id, servico2Id, "Lavagem Detalhada", 150.0, 60]
    );

    // Repare no formato JSONB para forma_manual_detalhe na nova estrutura
    await client.query(
      `INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em) VALUES ($1, $2, $3, $4, $5, $6)`,
      [agendamento1Id, "manual", JSON.stringify({ tipo: "dinheiro" }), 150.0, "confirmado", new Date().toISOString()]
    );

    // ---> AGENDAMENTO 2: Futuro e Pendente (Aparece na Agenda)
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    amanha.setHours(14, 0, 0, 0);
    const amanhaFim = new Date(amanha.getTime() + 120 * 60 * 1000);

    const agendamento2Result = await client.query(
      `INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [lojaId, cliente2Id, veiculo2Id, amanha.toISOString(), amanhaFim.toISOString(), 120, 320.0, "agendado"]
    );
    const agendamento2Id = agendamento2Result.rows[0].id;

    await client.query(
      `INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5)`,
      [agendamento2Id, servico1Id, "Polimento Completo", 320.0, 120]
    );

    await client.query(
      `INSERT INTO pagamentos (agendamento_id, forma, valor, status) VALUES ($1, $2, $3, $4)`,
      [agendamento2Id, "pix", 320.0, "pendente"]
    );

    console.log("✅ Seed de teste aplicada com sucesso.");
    console.log(" ");
    console.log("=== Credenciais Administrativas ===");
    console.log("Admin: dev.lucas.silva59@gmail.com");
    console.log("Senha: Lucas2312");
    console.log(" ");
    console.log("=== Credenciais Públicas (Simular Clientes) ===");
    console.log("Cliente 1: +55 11 99999-9999 (Tem agendamento concluído)");
    console.log("Cliente 2: +55 11 88888-8888 (Tem agendamento agendado amanhã)");

  } catch (err) {
    console.error("❌ Erro durante reset/seed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();