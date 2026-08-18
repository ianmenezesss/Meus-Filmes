"use client";

import Image from "next/image";

const STATUS_STYLES = {
  Concluido: "bg-accent/20 text-accent",
  "Em andamento": "bg-accent2/20 text-accent2",
  "Nao iniciada": "bg-gray-500/20 text-gray-400",
  Dropei: "bg-red-500/20 text-red-400",
};

function normalizeStatus(status) {
  // aceita "Concluído" com acento ou sem, pra bater com o CSS acima
  if (!status) return "Nao iniciada";
  return status.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function MovieCard({ movie, onClick }) {
  const statusKey = normalizeStatus(movie.status);
  const statusClass = STATUS_STYLES[statusKey] || STATUS_STYLES["Nao iniciada"];

  return (
    <button
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden bg-surface border border-border text-left hover:border-gold/60 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50"
      style={{ aspectRatio: "2/3" }}
    >
      {movie.poster_url ? (
        <Image
          src={movie.poster_url}
          alt={movie.title}
          fill
          sizes="(max-width: 768px) 45vw, (max-width: 1200px) 20vw, 15vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="poster-fallback w-full h-full flex items-center justify-center p-3 text-center">
          <span className="font-marquee text-xl text-gray-500">{movie.title}</span>
        </div>
      )}

      {/* gradiente + titulo no hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{movie.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{movie.year}</p>
      </div>

      {/* badge de status */}
      <span
        className={`absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusClass}`}
      >
        {movie.status}
      </span>

      {/* selo estilo ingresso com a nota pessoal */}
      {movie.my_rating != null && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 border border-gold flex items-center justify-center">
          <span className="font-mono text-[11px] text-gold font-semibold">{movie.my_rating}</span>
        </div>
      )}
    </button>
  );
}
