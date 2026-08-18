// Busca dados de um filme na OMDb API (dados vem do IMDb: poster, nota, sinopse)
// Chave gratuita em https://www.omdbapi.com/apikey.aspx
export async function fetchFromOMDb({ title, year }) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new Error("OMDB_API_KEY nao configurada no .env");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    t: title,
    plot: "short",
  });
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
    genre: data.Genre,
    runtime: data.Runtime,
    director: data.Director,
    actors: data.Actors,
  };
}
