import { NextResponse } from "next/server";
import { getMovieById, updateMovie, deleteMovie } from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  const movie = await getMovieById(id);
  if (!movie) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  return NextResponse.json(movie);
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const movie = await updateMovie(id, body);
    return NextResponse.json(movie);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar filme" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await deleteMovie(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao deletar filme" }, { status: 500 });
  }
}
