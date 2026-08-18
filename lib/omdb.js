// lib/omdb.js
//
// SERVIÇO ÚNICO de busca no OMDb (dados do IMDb). Usado tanto pelo fluxo
// automático (POST /api/movies/[id]/enrich, chamado ao criar um filme e
// pelo botão "buscar de novo") quanto pelo script batch (scripts/enrich-all.js).
// Antes existiam DUAS implementações quase idênticas (uma em lib/omdb.js,
// outra copiada dentro de scripts/enrich-all.js, e ainda uma terceira rota
// de API que nem passava original_title) — cada uma buscando de um jeito
// ligeiramente diferente. Consolidado aqui.
//
// ESTRATÉGIA DE BUSCA (problema: "Seppuku" e "Dune: Part Two" não eram
// encontrados):
//   A OMDb (?t=) faz busca por título "exato" — não é fuzzy. Um filme como
//   "Seppuku" está catalogado na OMDb sob o título internacional "Harakiri",
//   então buscar por "Seppuku" (título original japonês/romanizado) falha
//   mesmo sendo o título "correto". Não existe um único campo que sempre
//   funcione — por isso a busca tenta uma LISTA de candidatos, na ordem:
//     1. título original cadastrado pelo usuário (original_title), se houver
//     2. título cadastrado (title)
//     3. cada um dos anteriores "normalizado" (sem pontuação/acentos/espaços
//        duplicados) — cobre coisas como "Dune: Part Two" vs "Dune Part Two"
//   Se NENHUM candidato bater no endpoint exato (?t=), cai pro endpoint de
//   busca (?s=) com o melhor candidato e escolhe o resultado mais plausível
//   (mesmo ano, ou primeiro resultado). Isso é reportado como
//   `matchedVia: "search"` pra a UI poder avisar "encontrado por busca
//   aproximada, confira se é o filme certo".

function normalizeTitleForSearch(title) {
  return String(title)
    .normalize("NFKC")
    .replace(/[:._]/g, " ") // dois-pontos, pontos, underscores viram espaço
    .replace(/[^\p{L}\p{N}\s'-]/gu, "") // remove pontuação restante, mantém letras/números/acentos/hífen/apóstrofo
    .replace(/\s+/g, " ")
    .trim();
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
    matchedVia, // "exact" | "search"
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

// Função única usada por toda a aplicação (rota de API e script batch).
async function fetchFromOMDb({ title, originalTitle, year }) {
  const candidates = buildCandidates({ title, originalTitle });
  if (!candidates.length) return { found: false, error: "Nenhum título disponível para busca" };

  let lastError = null;

  // 1) tenta busca exata (?t=) com cada candidato, com e sem o ano
  //    (o ano ajuda a desambiguar remakes, mas às vezes o ano cadastrado
  //    está errado/vazio, então também tenta sem ano)
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

  // 2) fallback: busca aproximada (?s=) com o primeiro candidato, escolhe
  //    o resultado do mesmo ano se existir, senão o primeiro da lista
  const searchData = await omdbRequest({ s: candidates[0], type: "movie,series" });
  if (searchData.Response !== "False" && Array.isArray(searchData.Search) && searchData.Search.length) {
    const byYear = year ? searchData.Search.find((r) => String(r.Year).startsWith(String(year))) : null;
    const pick = byYear || searchData.Search[0];
    const detail = await omdbRequest({ i: pick.imdbID, plot: "short" });
    if (detail.Response !== "False") {
      return toResult(detail, "search", pick.Title);
    }
  }

  return { found: false, error: lastError || "Nao encontrado na OMDb" };
}

module.exports = { fetchFromOMDb, normalizeTitleForSearch };
