function normalizeTitleForSearch(title) {
  return String(title)
    .normalize("NFKC")
    .replace(/[:._]/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, "") 
    .replace(/\s+/g, " ")
    .trim();
}

const IMDB_ID_PATTERN = /^tt\d{7,8}$/i;

function isValidImdbId(value) {
  return typeof value === "string" && IMDB_ID_PATTERN.test(value.trim());
}

function buildCandidates({ title, originalTitle }) {
  const raw = [originalTitle, title].filter((t) => t && t.trim());
  const candidates = [];
  for (const t of raw) {
    const trimmed = t.trim();
    if (!candidates.includes(trimmed)) candidates.push(trimmed);
    const normalized = normalizeTitleForSearch(trimmed);
    if (normalized && !candidates.includes(normalized)) candidates.push(normalized);
  }
  return candidates;
}

async function omdbRequest(params) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) throw new Error("OMDB_API_KEY nao configurada");
  const search = new URLSearchParams({ apikey: apiKey, ...params });
  const res = await fetch(`https://www.omdbapi.com/?${search.toString()}`);
  return res.json();
}

function toResult(data, matchedVia, matchedTitle) {
  return {
    found: true,
    matchedVia,
    matchedTitle,
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

async function searchByImdbId(imdbId) {
  const data = await omdbRequest({ i: imdbId.trim(), plot: "short" });
  if (data.Response !== "False") {
    return toResult(data, "imdb_id", imdbId.trim());
  }
  return null;
}


async function fetchFromOMDb({ title, originalTitle, year, imdbId }) {

  if (isValidImdbId(imdbId)) {
    const byId = await searchByImdbId(imdbId);
    if (byId) return byId;

  }

  const candidates = buildCandidates({ title, originalTitle });

  let lastError = null;

  if (candidates.length) {

    for (const candidate of candidates) {
      for (const withYear of year ? [true, false] : [false]) {
        const params = { t: candidate, plot: "short" };
        if (withYear) params.y = String(year);
        const data = await omdbRequest(params);
        if (data.Response !== "False") {
          return toResult(data, "exact", candidate);
        }
        lastError = data.Error;
      }
    }


    const searchData = await omdbRequest({ s: candidates[0], type: "movie,series" });
    if (searchData.Response !== "False" && Array.isArray(searchData.Search) && searchData.Search.length) {
      const byYear = year ? searchData.Search.find((r) => String(r.Year).startsWith(String(year))) : null;
      const pick = byYear || searchData.Search[0];
      const detail = await omdbRequest({ i: pick.imdbID, plot: "short" });
      if (detail.Response !== "False") {
        return toResult(detail, "search", pick.Title);
      }
    }
  } else {
    lastError = "Nenhum título disponível para busca";
  }

  return { found: false, error: lastError || "Nao encontrado na OMDb" };
}

module.exports = { fetchFromOMDb, normalizeTitleForSearch, isValidImdbId };
