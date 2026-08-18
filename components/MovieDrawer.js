"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Star, RefreshCw, Trash2 } from "lucide-react";

const STATUS_OPTIONS = ["Nao iniciada", "Em andamento", "Concluido", "Dropei"];
const STATUS_LABELS = {
  "Nao iniciada": "Não iniciada",
  "Em andamento": "Em andamento",
  Concluido: "Concluído",
  Dropei: "Dropei",
};

export default function MovieDrawer({ movie, onClose, onUpdated, onDeleted }) {
  const [myRating, setMyRating] = useState(movie.my_rating ?? "");
  const [status, setStatus] = useState(movie.status ?? "Nao iniciada");
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [localMovie, setLocalMovie] = useState(movie);

  useEffect(() => {
    setLocalMovie(movie);
    setMyRating(movie.my_rating ?? "");
    setStatus(movie.status ?? "Nao iniciada");
  }, [movie]);

  async function saveField(patch) {
    setSaving(true);
    try {
      const res = await fetch(`/api/movies/${localMovie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setLocalMovie(updated);
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnrich() {
    setEnriching(true);
    try {
      const res = await fetch(`/api/movies/${localMovie.id}/enrich`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setLocalMovie(updated);
        onUpdated(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Não foi possível buscar dados do IMDb.");
      }
    } finally {
      setEnriching(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${localMovie.title}" da sua lista?`)) return;
    await fetch(`/api/movies/${localMovie.id}`, { method: "DELETE" });
    onDeleted(localMovie.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto animate-[slideIn_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 rounded-full p-1.5 hover:bg-black/80"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative w-full" style={{ aspectRatio: "2/3", maxHeight: "50vh" }}>
          {localMovie.poster_url ? (
            <Image src={localMovie.poster_url} alt={localMovie.title} fill className="object-cover" />
          ) : (
            <div className="poster-fallback w-full h-full flex items-center justify-center">
              <span className="font-marquee text-3xl text-gray-500 px-6 text-center">
                {localMovie.title}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>

        <div className="p-5 -mt-8 relative">
          <h2 className="font-marquee text-3xl leading-none">{localMovie.title}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {localMovie.year} {localMovie.runtime ? `· ${localMovie.runtime}` : ""}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {(localMovie.genres || []).map((g) => (
              <span key={g} className="text-[11px] bg-white/5 border border-border rounded px-2 py-0.5 text-gray-300">
                {g}
              </span>
            ))}
          </div>

          {/* Notas lado a lado */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-black/30 border border-border rounded-lg p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Nota IMDb</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-teal fill-teal" />
                <span className="font-mono text-lg text-teal">
                  {localMovie.imdb_rating != null ? localMovie.imdb_rating : "—"}
                </span>
              </div>
            </div>
            <div className="bg-black/30 border border-gold/40 rounded-lg p-3">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Sua nota</p>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={myRating}
                onChange={(e) => setMyRating(e.target.value)}
                onBlur={() =>
                  saveField({ my_rating: myRating === "" ? null : parseFloat(myRating) })
                }
                placeholder="—"
                className="w-16 bg-transparent font-mono text-lg text-gold focus:outline-none border-b border-transparent focus:border-gold"
              />
            </div>
          </div>

          {/* Botao pra buscar dados do IMDb */}
          {!localMovie.imdb_id && (
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="w-full mt-3 flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-sm text-gray-300 hover:border-gold/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${enriching ? "animate-spin" : ""}`} />
              {enriching ? "Buscando no IMDb..." : "Buscar pôster, sinopse e nota do IMDb"}
            </button>
          )}

          {/* Status */}
          <div className="mt-5">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    saveField({ status: s });
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    status === s
                      ? "bg-gold text-black border-gold"
                      : "border-border text-gray-400 hover:border-gold/50"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Sinopse */}
          {localMovie.plot && (
            <div className="mt-5">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1.5">Sinopse</p>
              <p className="text-sm text-gray-300 leading-relaxed">{localMovie.plot}</p>
            </div>
          )}

          {localMovie.linked_movies && (
            <div className="mt-5">
              <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1.5">Coleção</p>
              <span className="text-xs bg-gold/10 text-gold border border-gold/30 rounded px-2 py-1">
                {localMovie.linked_movies}
              </span>
            </div>
          )}

          <button
            onClick={handleDelete}
            className="w-full mt-8 flex items-center justify-center gap-2 text-xs text-red-400/70 hover:text-red-400 py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remover da lista
          </button>

          {saving && <p className="text-[11px] text-gray-600 text-center mt-1">Salvando...</p>}
        </div>
      </div>
    </div>
  );
}
