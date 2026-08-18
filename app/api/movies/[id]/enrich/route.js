import { NextResponse } from "next/server";
import { getMovieById, saveEnrichment } from "@/lib/db";
import { fetchFromOMDb } from "@/lib/omdb";

// IMPORTANTE: no projeto original existiam DOIS arquivos route.js
// diferentes para este mesmo caminho (app/api/movies/[id]/enrich/route.js)
// — um passava original_title pra busca, o outro não. Como só um dos dois
// pode fisicamente existir nesse caminho no repositório, qualquer que
// fosse o "vencedor" já era parte do bug de busca (ignorando o título
// original preenchido manualmente na gaveta do filme, por exemplo). Fique
// com ESTE arquivo único.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const movie = await getMovieById(id);
    if (!movie) {
      return NextResponse.json({ error: "Filme nao encontrado" }, { status: 404 });
    }

    const omdbData = await fetchFromOMDb({
      title: movie.title,
      originalTitle: movie.original_title,
      year: movie.year,
    });

    if (!omdbData.found) {
      return NextResponse.json(
        { error: `Não encontrado na OMDb: ${omdbData.error}. Tente preencher o título original.` },
        { status: 404 }
      );
    }

    const updated = await saveEnrichment(movie.id, {
      imdb_id: omdbData.imdb_id,
      imdb_rating: omdbData.imdb_rating,
      poster_url: omdbData.poster_url,
      plot: omdbData.plot,
    });

    return NextResponse.json({ ...updated, matchedVia: omdbData.matchedVia, matchedTitle: omdbData.matchedTitle });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erro ao enriquecer filme" }, { status: 500 });
  }
}
