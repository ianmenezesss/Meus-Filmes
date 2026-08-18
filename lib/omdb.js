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

// Reconhece um IMDb ID no formato ttXXXXXXX (7 a 8 dígitos, é o formato
// usado pelo IMDb — ex: tt0209144, tt1375666). Validação robusta e sem
// converter pra número (o prefixo "tt" faz parte do identificador).
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

// Busca direta por IMDb ID (endpoint ?i=), usada SOMENTE como fallback
// quando a busca por título (exata + aproximada) já falhou. Função
// separada da busca por título de propósito — mantém a estratégia
// principal intocada e isolada, e essa função só entra em ação quando
// searchByTitle() (a lógica acima, inalterada) já retornou "não
// encontrado".
async function searchByImdbId(imdbId) {
  const data = await omdbRequest({ i: imdbId.trim(), plot: "short" });
  if (data.Response !== "False") {
    return toResult(data, "imdb_id", imdbId.trim());
  }
  return null;
}

// Função única usada por toda a aplicação (rota de API e script batch).
//
// `imdbId` é OPCIONAL: é o valor hoje já gravado em movies.imdb_id, seja
// de um enrich anterior, seja digitado manualmente pelo usuário na gaveta
// do filme quando ele já sabe o ID certo.
//
// PRIORIDADE (mudou): se `imdbId` for um ID válido, ele é tentado
// PRIMEIRO, direto no endpoint ?i=, e se encontrar algo o resultado é
// retornado na hora — a busca por título nem chega a rodar.
//
// Antes o ID só era usado como último recurso, depois de tentar título
// exato e título aproximado. Isso causava um bug com títulos comuns
// (ex: "Memento"): a busca por título "funcionava" — encontrava *algum*
// filme com aquele nome — só que era o filme errado, e esse resultado
// errado sobrescrevia um ID que o usuário já tinha digitado
// corretamente, porque o ID nunca chegava a ser consultado. Como o campo
// de ID é preenchido manualmente pelo usuário exatamente pra dizer
// "eu sei qual é, é este", ele deve ganhar de uma busca por título
// heurística — não o contrário.
async function fetchFromOMDb({ title, originalTitle, year, imdbId }) {
  // 0) se o usuário já informou um IMDb ID válido, ele manda: tenta
  //    direto e, se encontrar, retorna sem nem passar pela busca por
  //    título.
  if (isValidImdbId(imdbId)) {
    const byId = await searchByImdbId(imdbId);
    if (byId) return byId;
    // ID informado não bateu na OMDb (digitado errado, filme removido
    // etc) — cai pra busca por título normalmente, como plano B.
  }

  const candidates = buildCandidates({ title, originalTitle });

  let lastError = null;

  if (candidates.length) {
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
  } else {
    lastError = "Nenhum título disponível para busca";
  }

  return { found: false, error: lastError || "Nao encontrado na OMDb" };
}

module.exports = { fetchFromOMDb, normalizeTitleForSearch, isValidImdbId };
