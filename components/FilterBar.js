"use client";

import { Search, Plus } from "lucide-react";
import { STATUS, STATUS_LABELS, STATUS_ORDER } from "@/lib/status";
import { SORT_OPTIONS, SORT_LABELS } from "@/lib/movieQuery";
import { GENRES } from "@/lib/genres";

export default function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  genre,
  setGenre,
  myRatingMin,
  setMyRatingMin,
  imdbRatingMin,
  setImdbRatingMin,
  sort,
  setSort,
  onAddClick,
  isAdmin,
}) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatus("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !status
                ? "bg-gold text-white-900 border-gold"
                : "bg-surface text-gray-500 border-border hover:border-gold/50"
            }`}
          >
            Todos
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                status === s
                  ? "bg-gold text-white-900 border-gold"
                  : "bg-surface text-gray-500 border-border hover:border-gold/50"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar filme..."
              className="bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm w-full sm:w-56 focus:outline-none focus:border-gold/60"
            />
          </div>
          {isAdmin && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 bg-gold text-white rounded-lg px-3 py-2 text-sm font-semibold hover:brightness-110 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          )}
        </div>
      </div>


      <div className="flex flex-wrap gap-3 items-center text-xs text-gray-400">
        {/*
        <label className="flex items-center gap-1.5">
          Minha nota ≥
          <select
            value={myRatingMin ?? ""}
            onChange={(e) => setMyRatingMin(e.target.value === "" ? null : Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="">Qualquer</option>
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          IMDb ≥
          <select
            value={imdbRatingMin ?? ""}
            onChange={(e) => setImdbRatingMin(e.target.value === "" ? null : Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="">Qualquer</option>
            {[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        */}

        <label className="flex items-center gap-1.5">
          Gênero
          <select
            value={genre ?? ""}
            onChange={(e) => setGenre(e.target.value || null)}
            className="bg-surface border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="">Todos</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 ml-auto">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-surface border border-border rounded-md px-2 py-1 text-xs"
          >
            {Object.values(SORT_OPTIONS).map((opt) => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
