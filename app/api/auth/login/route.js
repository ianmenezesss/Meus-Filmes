import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "ADMIN_USERNAME/ADMIN_PASSWORD nao configuradas no servidor." },
        { status: 500 }
      );
    }

    const validUsername = username === process.env.ADMIN_USERNAME;
    const validPassword = password === process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
