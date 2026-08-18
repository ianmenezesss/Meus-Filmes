"use client";

import { useState, useEffect, useMemo } from "react";
import { Film } from "lucide-react";
import MovieGrid from "@/components/MovieGrid";
import MovieDrawer from "@/components/MovieDrawer";
import AddMovieModal from "@/components/AddMovieModal";
import FilterBar from "@/components/FilterBar";
import { filterAndSortMovies, SORT_OPTIONS } from "@/lib/movieQuery";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [myRatingMin, setMyRatingMin] = useState(null);
  const [imdbRatingMin, setImdbRatingMin] = useState(null);
  const [sort, setSort] = useState(SORT_OPTIONS.DEFAULT);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadMovies();
  }, []);

  async function loadMovies() {
    setLoading(true);
    try {
      const res = await fetch("/api/movies");
      const data = await res.json();
      setMovies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  // Recalculado sempre que `movies` OU qualquer critério muda — é isso que
  // garante que, depois de editar um filme (ex: status -> Concluído), ele
  // aparece na posição correta imediatamente, sem precisar recarregar a
  // página. Antes, a ordem de exibição ficava "congelada" na ordem do
  // carregamento inicial porque nada recalculava a ordenação após um update.
  const visibleMovies = useMemo(
    () => filterAndSortMovies(movies, { status, search, myRatingMin, imdbRatingMin, sort }),
    [movies, status, search, myRatingMin, imdbRatingMin, sort]
  );

  function handleUpdated(updated) {
    setMovies((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelected(updated);
  }

  function handleCreated(created) {
    setMovies((prev) => [created, ...prev]);
  }

  function handleDeleted(id) {
    setMovies((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      <header className="flex items-center gap-2 mb-6">
        <Film className="w-6 h-6 text-gold" />
        <h1 className="font-marquee text-3xl tracking-wide">Meus Filmes</h1>
        <span className="text-xs text-gray-500 font-mono ml-auto">
          {visibleMovies.length} de {movies.length} {movies.length === 1 ? "filme" : "filmes"}
        </span>
      </header>

      <FilterBar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        myRatingMin={myRatingMin}
        setMyRatingMin={setMyRatingMin}
        imdbRatingMin={imdbRatingMin}
        setImdbRatingMin={setImdbRatingMin}
        sort={sort}
        setSort={setSort}
        onAddClick={() => setShowAdd(true)}
      />

      {loading ? (
        <div className="text-center py-24 text-gray-500 font-mono text-sm">Carregando...</div>
      ) : (
        <MovieGrid movies={visibleMovies} onSelect={setSelected} />
      )}

      {selected && (
        <MovieDrawer
          movie={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {showAdd && (
        <AddMovieModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
    </main>
  );
}
