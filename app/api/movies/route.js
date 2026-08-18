import { NextResponse } from "next/server";
import { getMovies, createMovie } from "@/lib/db";

// Sempre retorna a lista completa. Filtro/busca/ordenação acontecem no
// frontend (lib/movieQuery.js) — não existe mais um segundo filtro feito
// aqui via query string, pra não ter duas implementações de "o que é um
// filme concluído" que podem divergir.
export async function GET() {
  try {
    const movies = await getMovies();
    return NextResponse.json(movies);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar filmes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Titulo obrigatorio" }, { status: 400 });
    }
    const movie = await createMovie(body);
    return NextResponse.json(movie, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar filme" }, { status: 500 });
  }
}
