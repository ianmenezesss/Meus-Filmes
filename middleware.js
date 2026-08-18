import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";


const PROTECTED_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export async function middleware(request) {
  if (!PROTECTED_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAdmin = await verifySessionToken(token);

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Não autorizado. Faça login para editar o catálogo." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/api/movies", "/api/movies/:path*"],
};
