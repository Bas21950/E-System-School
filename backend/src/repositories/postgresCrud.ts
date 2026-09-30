import { getPostgresPool } from '../config/database';

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function sanitizePayload<T extends Record<string, unknown>>(payload: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

export async function selectAllRows<T>(table: string, orderBy = 'created_at desc'): Promise<T[]> {
  const pool = getPostgresPool();
  const result = await pool.query(`select * from ${quoteIdentifier(table)} order by ${orderBy}`);
  return result.rows as T[];
}

export async function selectRowById<T>(table: string, id: string): Promise<T> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select * from ${quoteIdentifier(table)} where id = $1 limit 1`,
    [id]
  );

  if (!result.rows[0]) {
    throw new Error(`${table} record not found`);
  }

  return result.rows[0];
}

export async function insertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const pool = getPostgresPool();
  const normalizedPayload = sanitizePayload(payload);
  const columns = Object.keys(normalizedPayload);

  if (columns.length === 0) {
    throw new Error(`Cannot insert empty payload into ${table}`);
  }

  const values = Object.values(normalizedPayload);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const sql = `insert into ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')})
    values (${placeholders})
    returning *`;
  const result = await pool.query(sql, values);
  return result.rows[0] as T;
}

export async function updateRowById<T>(
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<T> {
  const pool = getPostgresPool();
  const normalizedPayload = sanitizePayload(payload);
  const columns = Object.keys(normalizedPayload);

  if (columns.length === 0) {
    return selectRowById<T>(table, id);
  }

  const assignments = columns
    .map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)
    .join(', ');
  const values = [...Object.values(normalizedPayload), id];
  const result = await pool.query(
    `update ${quoteIdentifier(table)}
      set ${assignments}
      where id = $${columns.length + 1}
      returning *`,
    values
  );

  if (!result.rows[0]) {
    throw new Error(`${table} record not found`);
  }

  return result.rows[0] as T;
}

export async function deleteRowById(table: string, id: string): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(`delete from ${quoteIdentifier(table)} where id = $1`, [id]);
}
