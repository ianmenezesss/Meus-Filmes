// Importa o CSV exportado do Notion pro banco de dados.
// Uso: npm run db:import -- ./meus-filmes.csv
//
// Só deve ser rodado manualmente (import inicial ou reimport controlado) —
// NUNCA faz parte do build da Vercel. Cada linha vira um INSERT novo, então
// rodar duas vezes com o mesmo CSV duplica os filmes; não faz upsert por
// título porque o catálogo não tem um identificador estável e confiável
// entre o Notion e o app (ver README para o fluxo recomendado).
//
// CORREÇÃO: a coluna "Título Original" (adicionada ao CSV pra melhorar a
// busca no IMDb/OMDb) não estava mapeada aqui — o COLUMN_MAP nem sabia que
// ela existia e o INSERT não tinha o campo original_title. Resultado: por
// mais que o CSV estivesse com os títulos originais preenchidos, um
// reimport NUNCA gravava esse dado no banco. Adicionado abaixo.

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { Pool } = require("pg");
const { normalizeStatus } = require("../lib/status");

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
  originalTitle: "Título Original",
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

function parseOriginalTitle(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
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
          notion_id, title, original_title, status, genres, year, my_rating,
          upcoming, priority, linked_movies, runtime, added_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          parseIntSafe(row[COLUMN_MAP.notionId]),
          title.trim(),
          parseOriginalTitle(row[COLUMN_MAP.originalTitle]),
          normalizeStatus(row[COLUMN_MAP.status]),
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
