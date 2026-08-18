// Busca poster, sinopse e nota do IMDb (via OMDb) pra TODOS os filmes que
// ainda nao tem esses dados, com um intervalo entre as chamadas pra respeitar
// o limite gratuito da OMDb (1000 requisicoes/dia).
//
// Uso: npm run db:enrich

require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const DELAY_MS = 400; // ~2.5 chamadas/segundo, bem tranquilo pro limite gratuito

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromOMDb({ title, year }) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) throw new Error("OMDB_API_KEY nao configurada no .env.local");

  const params = new URLSearchParams({ apikey: apiKey, t: title, plot: "short" });
  if (year) params.set("y", year);

  const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`);
  const data = await res.json();

  if (data.Response === "False") {
    return { found: false, error: data.Error };
  }

  return {
    found: true,
    imdb_id: data.imdbID,
    imdb_rating: data.imdbRating && data.imdbRating !== "N/A" ? parseFloat(data.imdbRating) : null,
    poster_url: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
    plot: data.Plot && data.Plot !== "N/A" ? data.Plot : null,
  };
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

  const { rows: movies } = await pool.query(
    `SELECT id, title, year FROM movies WHERE imdb_id IS NULL ORDER BY title ASC`
  );

  console.log(`${movies.length} filmes sem dados do IMDb. Buscando...\n`);

  let ok = 0;
  let fail = 0;

  for (const movie of movies) {
    try {
      const data = await fetchFromOMDb({ title: movie.title, year: movie.year });
      if (!data.found) {
        console.log(`✗ ${movie.title} — nao encontrado (${data.error})`);
        fail++;
      } else {
        await pool.query(
          `UPDATE movies SET imdb_id = $1, imdb_rating = $2, poster_url = $3, plot = $4, enriched_at = NOW() WHERE id = $5`,
          [data.imdb_id, data.imdb_rating, data.poster_url, data.plot, movie.id]
        );
        console.log(`✓ ${movie.title} (${data.imdb_rating ?? "sem nota"})`);
        ok++;
      }
    } catch (err) {
      console.log(`✗ ${movie.title} — erro: ${err.message}`);
      fail++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nConcluido: ${ok} atualizados, ${fail} nao encontrados/com erro.`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no enrich em lote:", err);
  process.exit(1);
});
