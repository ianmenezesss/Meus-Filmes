// lib/movieQuery.js
//
// ÚNICO lugar que decide "quais filmes aparecem e em que ordem". Antes,
// a "ordenação" era só a ORDER BY fixa do SQL (aplicada uma vez, no load
// inicial) e nunca era recalculada depois de uma edição — por isso, ao
// marcar "Marty Supreme" como Concluído, o filtro (recalculado no
// frontend a cada render) já mostrava certo, mas a posição dele na lista
// continuava congelada na ordem do carregamento inicial. Não havia duas
// fontes de dado divergentes — havia uma lista de dados correta e uma
// ordem de exibição que nunca era recalculada.
//
// Agora filterAndSortMovies() roda de novo (via useMemo) toda vez que a
// lista de filmes OU os critérios mudam, garantindo que filtro e
// ordenação sempre reflitam o estado atual dos dados.
//
// AGRUPAMENTO POR STATUS (aba "Todos"):
// Antes, a aba "Todos" (status = "") aplicava só o critério de ordenação
// escolhido (nota, título, etc) misturando todos os status juntos — não
// existia nenhum conceito de "grupo". Agora, sempre que nenhum filtro de
// status está ativo, os filmes são primeiro agrupados por status (com
// Concluído sempre no topo) e só DENTRO de cada grupo é que o critério de
// ordenação escolhido (padrão, nota, A-Z etc） é aplicado como
// desempate. Quando um status específico é selecionado no filtro, todos
// os filmes já são do mesmo status, então o agrupamento não faz diferença
// e o critério de ordenação é aplicado direto.

import { STATUS } from "./status";

export const SORT_OPTIONS = {
  DEFAULT: "default",
  TITLE_ASC: "title_asc",
  TITLE_DESC: "title_desc",
  MY_RATING_DESC: "my_rating_desc",
  MY_RATING_ASC: "my_rating_asc",
  IMDB_DESC: "imdb_desc",
  IMDB_ASC: "imdb_asc",
};

export const SORT_LABELS = {
  [SORT_OPTIONS.DEFAULT]: "Padrão",
  [SORT_OPTIONS.TITLE_ASC]: "A → Z",
  [SORT_OPTIONS.TITLE_DESC]: "Z → A",
  [SORT_OPTIONS.MY_RATING_DESC]: "Minha nota: maior → menor",
  [SORT_OPTIONS.MY_RATING_ASC]: "Minha nota: menor → maior",
  [SORT_OPTIONS.IMDB_DESC]: "IMDb: maior → menor",
  [SORT_OPTIONS.IMDB_ASC]: "IMDb: menor → maior",
};

// Ordem dos GRUPOS de status na aba "Todos". Concluído sempre primeiro,
// como pedido — os demais vêm em seguida (Em andamento, Não iniciada,
// Dropei por último, já que "dropado" é normalmente o que menos importa
// ver em destaque). Se quiser mudar a ordem dos grupos que não são
// Concluído, é só reordenar este array.
const STATUS_GROUP_ORDER = [
  STATUS.COMPLETED,
  STATUS.IN_PROGRESS,
  STATUS.NOT_STARTED,
  STATUS.DROPPED,
];

function statusGroupIndex(status) {
  const idx = STATUS_GROUP_ORDER.indexOf(status);
  return idx === -1 ? STATUS_GROUP_ORDER.length : idx; // status desconhecido vai pro final
}

function compareNullable(a, b, { nullsLast = true } = {}) {
  if (a == null && b == null) return 0;
  if (a == null) return nullsLast ? 1 : -1;
  if (b == null) return nullsLast ? -1 : 1;
  return a - b;
}

// Critérios de ordenação "dentro do grupo" (ou globais, quando um status
// específico já está filtrado).
const SORTERS = {
  [SORT_OPTIONS.TITLE_ASC]: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
  [SORT_OPTIONS.TITLE_DESC]: (a, b) => b.title.localeCompare(a.title, "pt-BR"),
  [SORT_OPTIONS.MY_RATING_DESC]: (a, b) => compareNullable(b.my_rating, a.my_rating),
  [SORT_OPTIONS.MY_RATING_ASC]: (a, b) => compareNullable(a.my_rating, b.my_rating),
  [SORT_OPTIONS.IMDB_DESC]: (a, b) => compareNullable(b.imdb_rating, a.imdb_rating),
  [SORT_OPTIONS.IMDB_ASC]: (a, b) => compareNullable(a.imdb_rating, b.imdb_rating),
  [SORT_OPTIONS.DEFAULT]: (a, b) =>
    compareNullable(b.my_rating, a.my_rating) || a.title.localeCompare(b.title, "pt-BR"),
};

// filters = { status, search, myRatingMin, imdbRatingMin, sort }
export function filterAndSortMovies(movies, filters = {}) {
  const { status, search, myRatingMin, imdbRatingMin, sort = SORT_OPTIONS.DEFAULT } = filters;

  const filtered = movies.filter((m) => {
    if (status && m.status !== status) return false;
    if (search && !m.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (myRatingMin != null && !(m.my_rating != null && m.my_rating >= myRatingMin)) return false;
    if (imdbRatingMin != null && !(m.imdb_rating != null && m.imdb_rating >= imdbRatingMin)) return false;
    return true;
  });

  const criteriaSorter = SORTERS[sort] || SORTERS[SORT_OPTIONS.DEFAULT];

  // Só agrupa por status quando a aba "Todos" está ativa (nenhum status
  // selecionado no filtro). Com um status específico filtrado, todos os
  // filmes já são do mesmo grupo, então o agrupamento é um no-op — mas
  // pulamos ele mesmo assim por clareza/performance.
  const comparator = status
    ? criteriaSorter
    : (a, b) => statusGroupIndex(a.status) - statusGroupIndex(b.status) || criteriaSorter(a, b);

  return [...filtered].sort(comparator);
}

export { STATUS };
