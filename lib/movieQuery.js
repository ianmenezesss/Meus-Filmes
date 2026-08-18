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

const STATUS_GROUP_ORDER = [
  STATUS.COMPLETED,
  STATUS.IN_PROGRESS,
  STATUS.NOT_STARTED,
  STATUS.DROPPED,
];

function statusGroupIndex(status) {
  const idx = STATUS_GROUP_ORDER.indexOf(status);
  return idx === -1 ? STATUS_GROUP_ORDER.length : idx; 
}

function compareNullable(a, b, { nullsLast = true } = {}) {
  if (a == null && b == null) return 0;
  if (a == null) return nullsLast ? 1 : -1;
  if (b == null) return nullsLast ? -1 : 1;
  return a - b;
}

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


export function filterAndSortMovies(movies, filters = {}) {
  const { status, genre, search, myRatingMin, imdbRatingMin, sort = SORT_OPTIONS.DEFAULT } = filters;

  const filtered = movies.filter((m) => {
    if (status && m.status !== status) return false;
    if (genre && !(m.genres || []).includes(genre)) return false;
    if (search && !m.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (myRatingMin != null && !(m.my_rating != null && m.my_rating >= myRatingMin)) return false;
    if (imdbRatingMin != null && !(m.imdb_rating != null && m.imdb_rating >= imdbRatingMin)) return false;
    return true;
  });

  const criteriaSorter = SORTERS[sort] || SORTERS[SORT_OPTIONS.DEFAULT];

  const comparator = status
    ? criteriaSorter
    : (a, b) => statusGroupIndex(a.status) - statusGroupIndex(b.status) || criteriaSorter(a, b);

  return [...filtered].sort(comparator);
}

export { STATUS };
