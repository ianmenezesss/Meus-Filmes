import { Pool } from "pg";
import { STATUS, normalizeStatus } from "./status";

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

export async function getMovies() {
  return query(`SELECT * FROM movies ORDER BY title ASC`);
}

export async function getMovieById(id) {
  const rows = await query(`SELECT * FROM movies WHERE id = $1`, [id]);
  return rows[0] || null;
}

function normalizeImdbId(value) {
  return value && String(value).trim() ? String(value).trim().toLowerCase() : null;
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
    imdb_id = null,
  } = data;

  const rows = await query(
    `INSERT INTO movies (title, original_title, status, genres, year, my_rating, upcoming, priority, linked_movies, runtime, imdb_id, added_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     RETURNING *`,
    [
      title,
      original_title,
      normalizeStatus(status),
      genres,
      year,
      my_rating,
      upcoming,
      priority,
      linked_movies,
      runtime,
      normalizeImdbId(imdb_id),
    ]
  );
  return rows[0];
}

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
  "imdb_id",
]);

export async function updateMovie(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) continue;
    fields.push(`${key} = $${i}`);
    let normalizedValue = value;
    if (key === "status") normalizedValue = normalizeStatus(value);
    if (key === "imdb_id") normalizedValue = normalizeImdbId(value);
    values.push(normalizedValue);
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
