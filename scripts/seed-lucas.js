const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Buscando loja principal...');
    const { rows: lojas } = await client.query('SELECT id, slug, nome FROM lojas ORDER BY created_at ASC LIMIT 1');
    if (!lojas.length) {
      console.error('Nenhuma loja encontrada no banco.');
      process.exit(1);
    }
    const loja = lojas[0];
    console.log('Loja encontrada:', loja.nome, '(', loja.id, ')');

    // 1. Inserir ou atualizar cliente Lucas Silva Barboza
    const telefone = '+5511946629129';
    const email = 'lucasbarboza299@gmail.com';
    const nome = 'Lucas Silva Barboza';

    let clienteId;
    const { rows: clienteExistente } = await client.query(
      'SELECT id FROM clientes WHERE loja_id =  AND (telefone =  OR email = )',
      'SELECT id FROM clientes WHERE loja_id = $1 AND (telefone = $2 OR email = $3)',
      [loja.id, telefone, email]
    );

    if (clienteExistente.length) {
      clienteId = clienteExistente[0].id;
      await client.query(
        'UPDATE clientes SET nome = , telefone = , email = , ativo = true WHERE id = ',
        'UPDATE clientes SET nome = $1, telefone = $2, email = $3, ativo = true WHERE id = $4',
        [nome, telefone, email, clienteId]
      );
      console.log('Cliente atualizado com sucesso:', clienteId);
    } else {
      const { rows: novoCliente } = await client.query(
        'INSERT INTO clientes (loja_id, nome, telefone, email) VALUES (, , , ) RETURNING id',
        'INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [loja.id, nome, telefone, email]
      );
      clienteId = novoCliente[0].id;
      console.log('Novo cliente cadastrado com sucesso:', clienteId);
    }

    // 2. Inserir Veículo BMW M3
    let veiculoId;
    const { rows: veiculoExistente } = await client.query(
      'SELECT id FROM veiculos WHERE cliente_id =  AND modelo = ',
      'SELECT id FROM veiculos WHERE cliente_id = $1 AND modelo = $2',
      [clienteId, 'BMW M3']
    );

    if (veiculoExistente.length) {
      veiculoId = veiculoExistente[0].id;
      await client.query(
        'UPDATE veiculos SET cor = , placa = , ativo = true WHERE id = ',
        'UPDATE veiculos SET cor = $1, placa = $2, ativo = true WHERE id = $3',
        ['Preta', 'TRM-3M26', veiculoId]
      );
      console.log('Veiculo BMW M3 atualizado:', veiculoId);
    } else {
      const { rows: novoVeiculo } = await client.query(
        'INSERT INTO veiculos (cliente_id, modelo, cor, placa) VALUES (, , , ) RETURNING id',
        'INSERT INTO veiculos (cliente_id, modelo, cor, placa) VALUES ($1, $2, $3, $4) RETURNING id',
        [clienteId, 'BMW M3', 'Preta', 'TRM-3M26']
      );
      veiculoId = novoVeiculo[0].id;
      console.log('Veiculo BMW M3 cadastrado:', veiculoId);
    }

    // 3. Obter ou criar serviços representativos
    async function garantirServico(nomeServ, preco, duracao) {
      const { rows } = await client.query(
        'SELECT id FROM servicos WHERE loja_id =  AND nome = ',
        'SELECT id FROM servicos WHERE loja_id = $1 AND nome = $2',
        [loja.id, nomeServ]
      );
      if (rows.length) return rows[0].id;
      const { rows: ins } = await client.query(
        'INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos) VALUES (, , , , ) RETURNING id',
        'INSERT INTO servicos (loja_id, nome, descricao, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [loja.id, nomeServ, 'Serviço especializado de detailing automotivo.', preco, duracao]
      );
      return ins[0].id;
    }

    const sPolimento = await garantirServico('Polimento Técnico e Vitrificação', 1250.00, 240);
    const sLavagem = await garantirServico('Lavagem Detalhada Premium', 280.00, 90);
    const sCouro = await garantirServico('Higienização e Hidratação de Couro', 380.00, 120);

    // 4. Limpar agendamentos de teste anteriores deste cliente
    await client.query('DELETE FROM agendamentos WHERE cliente_id = ', [clienteId]);
    await client.query('DELETE FROM agendamentos WHERE cliente_id = $1', [clienteId]);

    // Agendamento 1: Concluído e Pago (Passado - 2 dias atrás)
    const d1Inicio = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    d1Inicio.setHours(9, 0, 0, 0);
    const d1Fim = new Date(d1Inicio.getTime() + 90 * 60 * 1000);

    const { rows: ag1 } = await client.query(
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES (, , , , , , , , , ) RETURNING id',
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [loja.id, clienteId, veiculoId, d1Inicio.toISOString(), d1Fim.toISOString(), 90, 280.00, 'concluido', true, 'Primeira lavagem detalhada de entrega. Veículo impecável.']
    );
    await client.query(
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES (, , , , )',
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5)',
      [ag1[0].id, sLavagem, 'Lavagem Detalhada Premium', 280.00, 90]
    );
    await client.query(
      'INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em) VALUES (, , , , , )',
      'INSERT INTO pagamentos (agendamento_id, forma, forma_manual_detalhe, valor, status, confirmado_em) VALUES ($1, $2, $3, $4, $5, $6)',
      [ag1[0].id, 'manual', JSON.stringify({ tipo: 'pix', comprovante: 'Banco Inter' }), 280.00, 'confirmado', d1Inicio.toISOString()]
    );

    // Agendamento 2: Em andamento / No Box (Hoje)
    const d2Inicio = new Date();
    d2Inicio.setHours(13, 30, 0, 0);
    const d2Fim = new Date(d2Inicio.getTime() + 240 * 60 * 1000);

    const { rows: ag2 } = await client.query(
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES (, , , , , , , , , ) RETURNING id',
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [loja.id, clienteId, veiculoId, d2Inicio.toISOString(), d2Fim.toISOString(), 240, 1250.00, 'em_andamento', true, 'Cuidado redobrado com as rodas forjadas aro 19 e película frontal PPF. Aplicar vitrificador Gyeon.']
    );
    await client.query(
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES (, , , , )',
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5)',
      [ag2[0].id, sPolimento, 'Polimento Técnico e Vitrificação', 1250.00, 240]
    );
    await client.query(
      'INSERT INTO pagamentos (agendamento_id, forma, valor, status) VALUES (, , , )',
      'INSERT INTO pagamentos (agendamento_id, forma, valor, status) VALUES ($1, $2, $3, $4)',
      [ag2[0].id, 'pix', 1250.00, 'pendente']
    );

    // Agendamento 3: Futuro (Amanhã)
    const d3Inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d3Inicio.setHours(10, 0, 0, 0);
    const d3Fim = new Date(d3Inicio.getTime() + 120 * 60 * 1000);

    const { rows: ag3 } = await client.query(
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES (, , , , , , , , , ) RETURNING id',
      'INSERT INTO agendamentos (loja_id, cliente_id, veiculo_id, data_hora, data_fim, duracao_minutos, valor, status, presenca_confirmada, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [loja.id, clienteId, veiculoId, d3Inicio.toISOString(), d3Fim.toISOString(), 120, 380.00, 'agendado', false, 'Tratamento preventivo dos bancos esportivos em couro Merino.']
    );
    await client.query(
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES (, , , , )',
      'INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_servico, preco, duracao_minutos) VALUES ($1, $2, $3, $4, $5)',
      [ag3[0].id, sCouro, 'Higienização e Hidratação de Couro', 380.00, 120]
    );

    console.log('=== SEED CONCLUÍDA COM SUCESSO! ===');
    console.log('Cliente:', nome);
    console.log('Telefone:', telefone);
    console.log('Email:', email);
    console.log('Veiculo: BMW M3 Preta (TRM-3M26)');
    console.log('Agendamento Concluído ID:', ag1[0].id);
    console.log('Agendamento Em Andamento ID:', ag2[0].id);
    console.log('Agendamento Futuro ID:', ag3[0].id);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
