import { pool } from "./client";

export async function listarClientes(lojaId: string, busca?: string, pagina = 1, limite = 10) {
  const offset = (pagina - 1) * limite;

  const countQuery = await pool.query(
    `SELECT COUNT(*) FROM clientes 
     WHERE loja_id = $1 
       AND ($2::text IS NULL OR nome ILIKE '%' || $2 || '%' OR telefone ILIKE '%' || $2 || '%')`,
    [lojaId, busca ?? null]
  );
  const total = parseInt(countQuery.rows[0].count, 10);

  const { rows } = await pool.query(
    `SELECT c.id, c.loja_id, c.nome, c.telefone, c.email,
            COALESCE(
              json_agg(
                json_build_object('id', v.id, 'placa', v.placa, 'modelo', v.modelo, 'cor', v.cor)
              ) FILTER (WHERE v.id IS NOT NULL), '[]'
            ) as veiculos
     FROM clientes c
     LEFT JOIN veiculos v ON v.cliente_id = c.id
     WHERE c.loja_id = $1 
       AND ($2::text IS NULL OR c.nome ILIKE '%' || $2 || '%' OR c.telefone ILIKE '%' || $2 || '%')
     GROUP BY c.id
     ORDER BY c.nome ASC
     LIMIT $3 OFFSET $4`,
    [lojaId, busca ?? null, limite, offset]
  );

  return { clientes: rows, total, totalPaginas: Math.ceil(total / limite) };
}

export async function buscarOuCriarCliente(lojaId: string, dados: { nome: string; telefone: string, email?: string | null }) {
  const { rows: existente } = await pool.query(
    `SELECT id, email FROM clientes WHERE loja_id = $1 AND telefone = $2`,
    [lojaId, dados.telefone]
  );

  if (existente[0]) {
    const cliente = existente[0];
    // If client exists and a new/different email is provided, update it.
    if (dados.email && dados.email !== cliente.email) {
      await pool.query(
        `UPDATE clientes SET email = $1 WHERE id = $2`,
        [dados.email, cliente.id]
      );
    }
    return cliente.id as string;
  }

  const { rows: novo } = await pool.query(
    `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lojaId, dados.nome, dados.telefone, dados.email ?? null]
  );
  return novo[0].id as string;
}

export async function buscarClientePorId(id: string) {
  const { rows } = await pool.query(`SELECT * FROM clientes WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function criarCliente(lojaId: string, dados: { nome: string; telefone: string; email?: string | null }) {
  const { rows } = await pool.query(
    `INSERT INTO clientes (loja_id, nome, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id`,
    [lojaId, dados.nome, dados.telefone, dados.email ?? null]
  );
  return rows[0].id as string;
}

export async function atualizarCliente(clienteId: string, dados: { nome: string; telefone: string; email?: string | null }) {
  await pool.query(
    `UPDATE clientes SET nome = $1, telefone = $2, email = $3 WHERE id = $4`,
    [dados.nome, dados.telefone, dados.email ?? null, clienteId]
  );
}

export async function deletarCliente(clienteId: string) {
  await pool.query(`DELETE FROM clientes WHERE id = $1`, [clienteId]);
}

export async function listarVeiculosDoCliente(clienteId: string) {
  const { rows } = await pool.query(`SELECT id, placa, modelo, cor FROM veiculos WHERE cliente_id = $1 ORDER BY created_at DESC`, [clienteId]);
  return rows;
}

export async function buscarVeiculoPorId(veiculoId: string) {
  const { rows } = await pool.query(`SELECT * FROM veiculos WHERE id = $1`, [veiculoId]);
  return rows[0] ?? null;
}

export async function criarVeiculo(clienteId: string, dados: { placa?: string; modelo: string; cor?: string }) {
  const { rows } = await pool.query(
    `INSERT INTO veiculos (cliente_id, placa, modelo, cor) VALUES ($1, $2, $3, $4) RETURNING id`,
    [clienteId, dados.placa ?? null, dados.modelo, dados.cor ?? null]
  );
  return rows[0].id as string;
}

export async function deletarVeiculo(veiculoId: string) {
  await pool.query(`DELETE FROM veiculos WHERE id = $1`, [veiculoId]);
}