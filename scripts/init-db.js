// Roda uma vez pra criar a tabela no banco.
// Uso: npm run db:init
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

async function main() {
  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
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
      status TEXT DEFAULT 'Nao iniciada',
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

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(LOWER(title));`);

  console.log("Tabela 'movies' criada/verificada com sucesso.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao criar tabela:", err);
  process.exit(1);
});
