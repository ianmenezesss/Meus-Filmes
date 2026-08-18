"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { STATUS, STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import { GENRES } from "@/lib/genres";

export default function AddMovieModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [imdbId, setImdbId] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState(STATUS.NOT_STARTED);
  const [myRating, setMyRating] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [saving, setSaving] = useState(false);
  const [autoFetch, setAutoFetch] = useState(true);

  function toggleGenre(g) {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          original_title: originalTitle.trim() || null,
          imdb_id: imdbId.trim() || null,
          year: year ? parseInt(year, 10) : null,
          status,
          my_rating: myRating === "" ? null : parseFloat(myRating),
          genres: selectedGenres,
        }),
      });
      const movie = await res.json();


      if (autoFetch) {
        try {
          const enrichRes = await fetch(`/api/movies/${movie.id}/enrich`, { method: "POST" });
          if (enrichRes.ok) {
            const enriched = await enrichRes.json();
            onCreated(enriched);
            onClose();
            return;
          }
        } catch {
          
        }
      }

      onCreated(movie);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md bg-surface border border-border rounded-xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-marquee text-2xl mb-4">Adicionar filme</h3>

        <label className="block text-xs text-gray-400 mb-1">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold/60"
          placeholder="Ex: Interestelar"
        />

        <label className="block text-xs text-gray-400 mb-1">Título original (opcional, ajuda a busca no IMDb)</label>
        <input
          value={originalTitle}
          onChange={(e) => setOriginalTitle(e.target.value)}
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold/60"
          placeholder="Ex: Interstellar"
        />

        <label className="block text-xs text-gray-400 mb-1">IMDb ID conhecido (opcional)</label>
        <input
          value={imdbId}
          onChange={(e) => setImdbId(e.target.value)}
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-3 font-mono focus:outline-none focus:border-gold/60"
          placeholder="Ex: tt0209144 — se preenchido, é usado direto (pula a busca por título)"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ano</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/60
                    [appearance:textfield]
                    [&::-webkit-inner-spin-button]:appearance-none
                    [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="2014"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sua nota (opcional)</label>
            <input
              value={myRating}
              onChange={(e) => setMyRating(e.target.value)}
              type="number"
              min="0"
              max="10"
              step="0.1"
              className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/60
                    [appearance:textfield]
                    [&::-webkit-inner-spin-button]:appearance-none
                    [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="—"
            />
          </div>
        </div>

        <label className="block text-xs text-gray-400 mb-1">Gêneros</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {GENRES.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => toggleGenre(g)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedGenres.includes(g)
                  ? "bg-gold text-white border-gold"
                  : "border-border text-gray-400 hover:border-gold/50"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <label className="block text-xs text-gray-400 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-gold/60"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <input
            type="checkbox"
            checked={autoFetch}
            onChange={(e) => setAutoFetch(e.target.checked)}
          />
          Buscar pôster, sinopse e nota do IMDb automaticamente
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gold text-white font-semibold rounded-lg py-2.5 text-sm hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Adicionar filme"}
        </button>
      </form>
    </div>
  );
}
