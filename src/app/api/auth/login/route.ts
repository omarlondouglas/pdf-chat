import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkCredentials,
  sign,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { username?: string; password?: string };
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuário e senha obrigatórios" },
      { status: 400 }
    );
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const token = sign(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
