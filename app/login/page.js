"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível entrar.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-24">
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Lock className="w-5 h-5 text-gold" />
        <h1 className="font-marquee text-2xl">Entrar</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5">
        <label className="block text-xs text-gray-400 mb-1">Usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
          autoComplete="username"
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold/60"
        />

        <label className="block text-xs text-gray-400 mb-1">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gold/60"
        />

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-white font-semibold rounded-lg py-2.5 text-sm hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-xs text-gray-600 text-center mt-4">
        Sem login você ainda pode navegar por todos os filmes — só não pode adicionar, editar ou apagar nada.
      </p>
    </main>
  );
}
