// Busca poster, sinopse e nota do IMDb (via OMDb) pra filmes que ainda nao
// tem esses dados (imdb_id IS NULL), usando o MESMO serviço de busca
// (lib/omdb.js) que a rota /api/movies/[id]/enrich usa — não existe mais
// lógica de busca duplicada entre o app e este script.
//
// NÃO faz parte do build da Vercel (ver README) — rode manualmente quando
// quiser, ou agende como Vercel Cron Job separado se preferir automação.
// Filmes com imdb_id ainda NULL nunca são "esquecidos": simplesmente
// aparecem de novo na próxima execução, então uma falha de rede/OMDb num
// filme específico não exige nenhuma ação manual de "resetar" o registro.
//
// Uso: npm run db:enrich [-- --force]
//   --force  também re-busca filmes que já têm imdb_id (útil depois de
//            preencher/corrigir um original_title manualmente em lote)

require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const { fetchFromOMDb } = require("../lib/omdb");

const DELAY_MS = 400; // ~2.5 chamadas/segundo, tranquilo pro limite gratuito da OMDb

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  const force = process.argv.includes("--force");
  const { rows: movies } = await pool.query(
    force
      ? `SELECT id, title, original_title, year FROM movies ORDER BY title ASC`
      : `SELECT id, title, original_title, year FROM movies WHERE imdb_id IS NULL ORDER BY title ASC`
  );

  console.log(`${movies.length} filme(s) para buscar no IMDb...\n`);

  let ok = 0;
  let fail = 0;
  const failures = [];

  for (const movie of movies) {
    try {
      const data = await fetchFromOMDb({
        title: movie.title,
        originalTitle: movie.original_title,
        year: movie.year,
      });
      if (!data.found) {
        console.log(`✗ ${movie.title} — não encontrado (${data.error})`);
        failures.push(movie.title);
        fail++;
      } else {
        await pool.query(
          `UPDATE movies SET imdb_id = $1, imdb_rating = $2, poster_url = $3, plot = $4, enriched_at = NOW() WHERE id = $5`,
          [data.imdb_id, data.imdb_rating, data.poster_url, data.plot, movie.id]
        );
        const via = data.matchedVia === "search" ? " (via busca aproximada, confira)" : "";
        console.log(`✓ ${movie.title} — ${data.imdb_rating ?? "sem nota"}${via}`);
        ok++;
      }
    } catch (err) {
      console.log(`✗ ${movie.title} — erro: ${err.message}`);
      failures.push(movie.title);
      fail++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nConcluído: ${ok} atualizados, ${fail} não encontrados/com erro.`);
  if (failures.length) {
    console.log(`Filmes que precisam de título original manual: ${failures.join(", ")}`);
  }
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no enrich em lote:", err);
  process.exit(1);
});
