import { NextResponse } from "next/server";
import { getMovies, createMovie } from "@/lib/db";


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
