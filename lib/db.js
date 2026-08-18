import { Pool } from "pg";
import { STATUS, normalizeStatus } from "./status";

// Reaproveita a conexao entre chamadas (importante em serverless/dev).
let pool;
function getPool() {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      process.env.PRISMA_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "POSTGRES_URL nao configurada. Conecte um banco Postgres na aba Storage da Vercel (ou preencha .env.local)."
      );
    }
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function query(text, params = []) {
  const { rows } = await getPool().query(text, params);
  return rows;
}

// getMovies NÃO filtra nem ordena no SQL. O catálogo pessoal é pequeno
// (centenas, não milhões, de filmes), então filtro/ordenação são feitos
// inteiramente no frontend (lib/movieQuery.js), sobre os MESMOS dados,
// pra nunca existir uma "versão filtrada" e uma "versão ordenada"
// derivadas de lugares diferentes — uma única lista, um único pipeline.
export async function getMovies() {
  return query(`SELECT * FROM movies ORDER BY title ASC`);
}

export async function getMovieById(id) {
  const rows = await query(`SELECT * FROM movies WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createMovie(data) {
  const {
    title,
    status = STATUS.NOT_STARTED,
    genres = [],
    year = null,
    my_rating = null,
    upcoming = false,
    priority = false,
    linked_movies = null,
    runtime = null,
    original_title = null,
  } = data;

  const rows = await query(
    `INSERT INTO movies (title, original_title, status, genres, year, my_rating, upcoming, priority, linked_movies, runtime, added_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     RETURNING *`,
    [title, original_title, normalizeStatus(status), genres, year, my_rating, upcoming, priority, linked_movies, runtime]
  );
  return rows[0];
}

// Campos que o USUÁRIO pode editar diretamente. Note que os campos vindos
// do IMDb/OMDb (imdb_id, imdb_rating, poster_url, plot, enriched_at) NÃO
// estão aqui — eles só são gravados por saveEnrichment(), nunca por um
// PATCH genérico vindo do frontend, e nunca sobrescritos pelo import de CSV.
const ALLOWED_UPDATE_FIELDS = new Set([
  "title",
  "original_title",
  "status",
  "genres",
  "year",
  "my_rating",
  "upcoming",
  "priority",
  "linked_movies",
  "runtime",
]);

export async function updateMovie(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) continue;
    fields.push(`${key} = $${i}`);
    values.push(key === "status" ? normalizeStatus(value) : value);
    i++;
  }
  if (!fields.length) return getMovieById(id);

  values.push(id);
  const rows = await query(`UPDATE movies SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return rows[0];
}

export async function deleteMovie(id) {
  await query(`DELETE FROM movies WHERE id = $1`, [id]);
  return true;
}

// Único ponto que grava dados vindos do IMDb/OMDb. Nunca toca em status,
// my_rating, ou qualquer outro campo editável pelo usuário.
export async function saveEnrichment(id, data) {
  const { imdb_id, imdb_rating, poster_url, plot } = data;
  const rows = await query(
    `UPDATE movies
     SET imdb_id = $1, imdb_rating = $2, poster_url = $3, plot = $4, enriched_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [imdb_id, imdb_rating, poster_url, plot, id]
  );
  return rows[0];
}
