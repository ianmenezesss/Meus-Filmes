// Cria/atualiza o schema. Idempotente: pode rodar em todo deploy sem
// destruir nada — só cria o que falta e normaliza status legados.
// Uso: npm run db:init
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const { STATUS, normalizeStatus } = require("../lib/status");

async function main() {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.PRISMA_DATABASE_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL nao encontrada. Preencha o .env.local (veja .env.example).");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      notion_id INTEGER,
      title TEXT NOT NULL,
      status TEXT DEFAULT '${STATUS.NOT_STARTED}',
      genres TEXT[] DEFAULT '{}',
      year INTEGER,
      my_rating NUMERIC(3,1),
      upcoming BOOLEAN DEFAULT FALSE,
      priority BOOLEAN DEFAULT FALSE,
      linked_movies TEXT,
      runtime TEXT,
      added_at TIMESTAMP DEFAULT NOW(),
      imdb_id TEXT,
      imdb_rating NUMERIC(3,1),
      poster_url TEXT,
      plot TEXT,
      enriched_at TIMESTAMP
    );
  `);

  await pool.query(`ALTER TABLE movies ADD COLUMN IF NOT EXISTS original_title TEXT;`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(LOWER(title));`);

  // --- Migração de status legados ---
  // O CSV do Notion e telas antigas do app gravaram status como texto
  // livre e não-padronizado ("Concluído", "Nao iniciada", etc). Aqui
  // convertemos qualquer valor fora dos 4 códigos canônicos
  // (NOT_STARTED/IN_PROGRESS/COMPLETED/DROPPED) para o código certo.
  // Rodar isso de novo em linhas já migradas não faz nada (idempotente).
  const canonical = Object.values(STATUS);
  const { rows: nonCanonical } = await pool.query(
    `SELECT id, status FROM movies WHERE status IS NULL OR status != ALL($1::text[])`,
    [canonical]
  );
  if (nonCanonical.length) {
    console.log(`Migrando ${nonCanonical.length} filme(s) com status legado para o formato canônico...`);
    for (const row of nonCanonical) {
      const normalized = normalizeStatus(row.status);
      await pool.query(`UPDATE movies SET status = $1 WHERE id = $2`, [normalized, row.id]);
    }
  }

  console.log("Tabela 'movies' criada/verificada com sucesso.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao criar tabela:", err);
  process.exit(1);
});
