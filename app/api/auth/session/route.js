import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAdmin = await verifySessionToken(token);
  return NextResponse.json({ isAdmin });
}
