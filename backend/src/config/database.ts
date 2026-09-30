import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export type DatabaseProvider = 'postgres';

const provider: DatabaseProvider = 'postgres';

let postgresPool: Pool | null = null;

function getPostgresConnectionConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  const config: Record<string, string | number> = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'eschool',
    user: process.env.DB_USER || 'postgres',
  };

  config.password = process.env.DB_PASSWORD?.trim() || 'postgres';

  return config;
}

export function getDatabaseProvider(): DatabaseProvider {
  return provider;
}

export function getPostgresPool(): Pool {
  if (!postgresPool) {
    postgresPool = new Pool(getPostgresConnectionConfig());
  }

  return postgresPool;
}

export async function checkDatabaseConnection(): Promise<{ provider: DatabaseProvider }> {
  const pool = getPostgresPool();
  await pool.query('select 1');
  return { provider };
}

export async function ensureReceiptSettingsSchema(): Promise<void> {
  const pool = getPostgresPool();
    await pool.query(`
      alter table if exists system_receipt_settings
        add column if not exists receipt_output_dir text,
        add column if not exists receipt_email_enabled boolean not null default false,
        add column if not exists receipt_email_to text,
        add column if not exists receipt_gas_secret text
    `);
  }

export async function ensureStudentProfileSchema(): Promise<void> {
  const pool = getPostgresPool();
  await pool.query(`
    alter table students
      add column if not exists profile_data jsonb not null default '{}'::jsonb
  `);
}
