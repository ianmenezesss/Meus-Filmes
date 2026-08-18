import { NextResponse } from "next/server";
import { getMovieById, saveEnrichment } from "@/lib/db";
import { fetchFromOMDb } from "@/lib/omdb";

// Busca poster/nota IMDb/sinopse na OMDb e salva em cache no banco.
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
        { error: `Nao encontrado na OMDb: ${omdbData.error}` },
        { status: 404 }
      );
    }

    const updated = await saveEnrichment(movie.id, {
      imdb_id: omdbData.imdb_id,
      imdb_rating: omdbData.imdb_rating,
      poster_url: omdbData.poster_url,
      plot: omdbData.plot,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Erro ao enriquecer filme" }, { status: 500 });
  }
}
