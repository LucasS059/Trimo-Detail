// scripts/criar-loja.js
//
// Uso:
//   node scripts/criar-loja.js
//
// Pede os dados da loja no terminal e insere no banco já com a senha
// em hash bcrypt (o mesmo formato que lib/actions/auth.ts espera para
// validar o login).
//
// Requer as variáveis de ambiente carregadas (DATABASE_URL). Rode com:
//   npx dotenv -e .env.local -- node scripts/criar-loja.js
// ou defina manualmente:
//   $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/trimo_detail"
//   node scripts/criar-loja.js

const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function perguntar(rl, texto) {
  const resposta = await rl.question(texto);
  return resposta.trim();
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  console.log("=== Criar nova loja (tenant) ===\n");

  const nome = await perguntar(rl, "Nome da loja: ");
  const slug = await perguntar(rl, "Slug (link público, ex: joao-detail): ");
  const nomeDono = await perguntar(rl, "Nome do dono (opcional): ");
  const emailLogin = await perguntar(rl, "E-mail de login: ");
  const senha = await perguntar(rl, "Senha: ");
  const plano = await perguntar(rl, "Plano ('gratuito' ou 'pago') [gratuito]: ");

  rl.close();

  if (!nome || !slug || !emailLogin || !senha) {
    console.error("\nNome, slug, e-mail e senha são obrigatórios.");
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const { rows } = await client.query(
      `INSERT INTO lojas (nome, slug, nome_dono, email_login, senha_hash, plano)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, slug`,
      [nome, slug, nomeDono || null, emailLogin, senhaHash, plano || "gratuito"]
    );

    const loja = rows[0];

    // Cria horário de funcionamento padrão: segunda a sábado, 08h-18h, domingo fechado
    for (let diaSemana = 0; diaSemana <= 6; diaSemana++) {
      const fechado = diaSemana === 0; // domingo fechado por padrão
      await client.query(
        `INSERT INTO horarios_funcionamento (loja_id, dia_semana, hora_abertura, hora_fechamento, fechado)
         VALUES ($1, $2, '08:00', '18:00', $3)`,
        [loja.id, diaSemana, fechado]
      );
    }

    console.log(`\nLoja criada com sucesso!`);
    console.log(`ID: ${loja.id}`);
    console.log(`Link público: http://localhost:3000/${loja.slug}`);
    console.log(`Login admin: http://localhost:3000/login (e-mail: ${emailLogin})`);
    console.log(
      `\nHorário de funcionamento padrão criado (seg-sáb, 08h-18h). Ajuste depois pela tela de Configurações.`
    );
  } catch (err) {
    if (err.code === "23505") {
      console.error("\nJá existe uma loja com esse slug ou e-mail.");
    } else {
      console.error("\nErro ao criar loja:", err.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();