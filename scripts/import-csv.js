// Importa o CSV exportado do Notion pro banco de dados.
// Uso: npm run db:import -- ./meus-filmes.csv
//
// Se os nomes das colunas do seu CSV forem diferentes, ajuste o objeto
// COLUMN_MAP abaixo (chave = nome usado no codigo, valor = nome exato da coluna no CSV).

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");

const COLUMN_MAP = {
  notionId: "ID",
  title: "Nome",
  rating: "Classificação",
  status: "Status",
  genres: "Gêneros",
  year: "Ano",
  upcoming: "Próximos Filmes",
  priority: "Prioridade",
  addedAt: "Adicionado em",
  linkedMovies: "Filmes Ligados",
  runtime: "Minutagem",
};

function parseBool(value) {
  if (!value) return false;
  const v = String(value).trim().toLowerCase();
  return v === "yes" || v === "checked" || v === "true" || v === "sim" || v === "x";
}

function parseGenres(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function parseIntSafe(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Uso: npm run db:import -- ./caminho/para/filmes.csv");
    process.exit(1);
  }

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

  const csvContent = fs.readFileSync(path.resolve(filePath), "utf-8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  });

  console.log(`Encontrados ${records.length} filmes no CSV. Colunas detectadas:`, Object.keys(records[0] || {}));

  let imported = 0;
  let skipped = 0;

  for (const row of records) {
    const title = row[COLUMN_MAP.title];
    if (!title) {
      skipped++;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO movies (
          notion_id, title, status, genres, year, my_rating,
          upcoming, priority, linked_movies, runtime, added_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          parseIntSafe(row[COLUMN_MAP.notionId]),
          title.trim(),
          row[COLUMN_MAP.status] || "Nao iniciada",
          parseGenres(row[COLUMN_MAP.genres]),
          parseIntSafe(row[COLUMN_MAP.year]),
          parseNumber(row[COLUMN_MAP.rating]),
          parseBool(row[COLUMN_MAP.upcoming]),
          parseBool(row[COLUMN_MAP.priority]),
          row[COLUMN_MAP.linkedMovies] || null,
          row[COLUMN_MAP.runtime] || null,
        ]
      );
      imported++;
    } catch (err) {
      console.error(`Erro ao importar "${title}":`, err.message);
      skipped++;
    }
  }

  console.log(`\nImportacao concluida: ${imported} filmes importados, ${skipped} pulados.`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro na importacao:", err);
  process.exit(1);
});
