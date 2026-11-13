/**
 * Database Migration Runner for PRISM
 * Executes all SQL migrations in order against the PostgreSQL database.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';

// Parse .env.local natively without external dependencies
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envConfig = parseEnv('.env.local');
const connectionString = envConfig.DATABASE_URL;

if (!connectionString) {
  console.error('[Migration Runner] ERROR: DATABASE_URL not set in .env.local');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigrations() {
  console.log('[Migration Runner] Connecting to database...');
  try {
    await client.connect();
    console.log('[Migration Runner] Connected successfully.');

    // Create migrations tracker table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._prisma_or_system_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve('supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`[Migration Runner] Found ${files.length} migration files.`);

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT name FROM public._prisma_or_system_migrations WHERE name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`[Migration Runner] SKIP: ${file} (already applied)`);
        continue;
      }

      console.log(`[Migration Runner] APPLYING: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO public._prisma_or_system_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`[Migration Runner] SUCCESS: ${file}`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`[Migration Runner] FAILED: ${file}`, migrationErr.message);
        throw migrationErr;
      }
    }

    console.log('[Migration Runner] ALL MIGRATIONS COMPLETED SUCCESSFULLY.');
  } catch (err) {
    console.error('[Migration Runner] Migration execution error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
