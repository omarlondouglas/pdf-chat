import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth/*
     * - /_next, /favicon.ico, static files
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
