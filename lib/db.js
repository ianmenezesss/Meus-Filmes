import { Pool } from "pg";

// Reaproveita a conexao entre chamadas (importante em serverless/dev).
// POSTGRES_URL vem automaticamente quando voce conecta um banco Postgres
// na aba "Storage" do seu projeto na Vercel.
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
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params = []) {
  const { rows } = await getPool().query(text, params);
  return rows;
}

export async function getMovies({ status, search } = {}) {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    conditions.push(`LOWER(title) LIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return query(
    `SELECT * FROM movies ${where} ORDER BY
       CASE WHEN my_rating IS NULL THEN 1 ELSE 0 END,
       my_rating DESC NULLS LAST,
       title ASC`,
    params
  );
}

export async function getMovieById(id) {
  const rows = await query(`SELECT * FROM movies WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function createMovie(data) {
  const {
    title,
    status = "Nao iniciada",
    genres = [],
    year = null,
    my_rating = null,
    upcoming = false,
    priority = false,
    linked_movies = null,
    runtime = null,
  } = data;

  const rows = await query(
    `INSERT INTO movies (title, status, genres, year, my_rating, upcoming, priority, linked_movies, runtime, added_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [title, status, genres, year, my_rating, upcoming, priority, linked_movies, runtime]
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
]);

export async function updateMovie(id, data) {
  const fields = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_UPDATE_FIELDS.has(key)) continue;
    fields.push(`${key} = $${i}`);
    values.push(value);
    i++;
  }
  if (!fields.length) return getMovieById(id);

  values.push(id);
  const rows = await query(
    `UPDATE movies SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
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
