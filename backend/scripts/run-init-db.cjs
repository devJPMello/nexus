/**
 * Aplica scripts/init-db.sql usando DATABASE_URL do backend/.env
 * Uso: node scripts/run-init-db.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('Falta backend/.env com DATABASE_URL');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (!match) {
    throw new Error('DATABASE_URL não encontrada em .env');
  }
  let v = match[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

async function main() {
  const url = loadDatabaseUrl();
  const sqlPath = path.join(__dirname, 'init-db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log('OK: init-db.sql aplicado com sucesso.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
