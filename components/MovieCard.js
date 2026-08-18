"use client";

import Image from "next/image";
import { STATUS, STATUS_LABELS } from "@/lib/status";

// Antes havia uma função normalizeStatus() local aqui só pra fazer o CSS
// bater com o texto (stripando acentos "na mão"), porque o `movie.status`
// podia vir em formatos variados do banco. Agora `movie.status` SEMPRE
// vem no formato canônico (garantido por lib/status.js em toda escrita no
// banco), então o mapa de estilos usa os códigos diretamente.
const STATUS_STYLES = {
  [STATUS.COMPLETED]: "bg-accent/20 text-accent",
  [STATUS.IN_PROGRESS]: "bg-accent2/20 text-accent2",
  [STATUS.NOT_STARTED]: "bg-gray-500/20 text-gray-400",
  [STATUS.DROPPED]: "bg-red-500/20 text-red-400",
};

export default function MovieCard({ movie, onClick }) {
  const statusClass = STATUS_STYLES[movie.status] || STATUS_STYLES[STATUS.NOT_STARTED];

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

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
        <p className="font-semibold text-sm leading-tight line-clamp-2">{movie.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{movie.year}</p>
      </div>

      <span className={`absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${statusClass}`}>
        {STATUS_LABELS[movie.status] || STATUS_LABELS[STATUS.NOT_STARTED]}
      </span>

      {movie.my_rating != null && (
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 border border-gold flex items-center justify-center">
          <span className="font-mono text-[11px] text-gold font-semibold">{movie.my_rating}</span>
        </div>
      )}
    </button>
  );
}
