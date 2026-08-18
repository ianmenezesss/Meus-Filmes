"use client";

import MovieCard from "./MovieCard";

export default function MovieGrid({ movies, onSelect }) {
  if (!movies.length) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p className="font-marquee text-2xl mb-1">Nenhum filme encontrado</p>
        <p className="text-sm">Tente ajustar os filtros ou a busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onClick={() => onSelect(movie)} />
      ))}
    </div>
  );
}
