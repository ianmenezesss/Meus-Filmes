"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Film, LogOut } from "lucide-react";
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
  const [genre, setGenre] = useState(null);
  const [myRatingMin, setMyRatingMin] = useState(null);
  const [imdbRatingMin, setImdbRatingMin] = useState(null);
  const [sort, setSort] = useState(SORT_OPTIONS.DEFAULT);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadMovies();
    loadSession();
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

  async function loadSession() {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setIsAdmin(!!data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
  }

  const visibleMovies = useMemo(
    () => filterAndSortMovies(movies, { status, genre, search, myRatingMin, imdbRatingMin, sort }),
    [movies, status, genre, search, myRatingMin, imdbRatingMin, sort]
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
        {isAdmin ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 ml-3"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        ) : (
          <Link href="/login" className="text-xs text-gray-500 hover:text-gray-300 ml-3">
            Entrar
          </Link>
        )}
      </header>

      <FilterBar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        genre={genre}
        setGenre={setGenre}
        myRatingMin={myRatingMin}
        setMyRatingMin={setMyRatingMin}
        imdbRatingMin={imdbRatingMin}
        setImdbRatingMin={setImdbRatingMin}
        sort={sort}
        setSort={setSort}
        onAddClick={() => setShowAdd(true)}
        isAdmin={isAdmin}
      />

      {loading ? (
        <div className="text-center py-24 text-gray-500 font-mono text-sm">Carregando...</div>
      ) : (
        <MovieGrid movies={visibleMovies} onSelect={setSelected} />
      )}

      {selected && (
        <MovieDrawer
          movie={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {isAdmin && showAdd && (
        <AddMovieModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
    </main>
  );
}
