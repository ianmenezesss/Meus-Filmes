"use client";

import { Search, Plus } from "lucide-react";

const STATUSES = ["Todos", "Concluido", "Em andamento", "Nao iniciada", "Dropei"];
const STATUS_LABELS = {
  Todos: "Todos",
  Concluido: "Concluído",
  "Em andamento": "Em andamento",
  "Nao iniciada": "Não iniciada",
  Dropei: "Dropei",
};

export default function FilterBar({ search, setSearch, status, setStatus, onAddClick }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s === "Todos" ? "" : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              (status || "Todos") === s
                ? "bg-gold text-black border-gold"
                : "bg-surface text-gray-300 border-border hover:border-gold/50"
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
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 bg-gold text-black rounded-lg px-3 py-2 text-sm font-semibold hover:brightness-110 transition"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
