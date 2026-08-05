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

    console.log("🧪 Inserindo dados de teste...");

    const senhaHash = await bcrypt.hash("Lucas2312", 10);
    const lojaResult = await client.query(
      `INSERT INTO lojas (nome, slug, nome_dono, descricao, endereco, email_login, senha_hash, plano, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        "Loja de Teste",
        "loja-teste",
        "Proprietário Teste",
        "Loja criada para testes automáticos.",
        "Rua do Teste, 123",
        "dev.lucas.silva59@gmail.com",
        senhaHash,
        "gratuito",
        true,
      ]
    );
    const lojaId = lojaResult.rows[0].id;

    for (let dia = 0; dia <= 6; dia += 1) {
      await client.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, $3, $4, $5)`,
        [lojaId, dia, "08:00", "18:00", dia === 0]
      );
    }

    const clienteResult = await client.query(
      `INSERT INTO clientes (loja_id, nome, telefone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [lojaId, "Cliente de Teste", "+5511999999999", "cliente@teste.com"]
    );
    const clienteId = clienteResult.rows[0].id;

    const veiculoResult = await client.query(
      `INSERT INTO veiculos (cliente_id, placa, modelo, cor)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [clienteId, "ABC1234", "Civic G10", "Preto"]
    );
    const veiculoId = veiculoResult.rows[0].id;

    const servicoResult = await client.query(
      `INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [lojaId, "Polimento Completo", "Polimento automotivo completo com proteção de longa duração.", 320.0, 120]
    );
    const servicoId = servicoResult.rows[0].id;

    const dataHora = new Date(Date.now() + 24 * 60 * 60 * 1000);
    dataHora.setHours(10, 0, 0, 0);
    const dataFim = new Date(dataHora.getTime() + 120 * 60 * 1000);

    const agendamentoResult = await client.query(
      `INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        lojaId,
        clienteId,
        veiculoId,
        dataHora.toISOString(),
        dataFim.toISOString(),
        120,
        320.0,
        "agendado",
        false,
      ]
    );
    const agendamentoId = agendamentoResult.rows[0].id;

    await client.query(
      `INSERT INTO agendamento_servicos (agendamento_id, servico_id, nome_servico, preco, duracao_minutos)
       VALUES ($1, $2, $3, $4, $5)`,
      [agendamentoId, servicoId, "Polimento Completo", 320.0, 120]
    );

    await client.query(
      `INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [agendamentoId, "manual", "dinheiro", 320.0, "confirmado", new Date().toISOString()]
    );

    console.log("✅ Seed de teste aplicada com sucesso.");
    console.log("Admin: dev.lucas.silva59@gmail.com / Senha: Lucas2312");
    console.log("Cliente: cliente@teste.com / Tel: +55 11 99999-9999");
  } catch (err) {
    console.error("❌ Erro durante reset/seed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
