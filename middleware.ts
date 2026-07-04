import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/pin", "/setup-pin", "/api/pin", "/api/keep-alive"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (el matcher ya excluye estáticos y assets con extensión)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthed = await verifySessionToken(token, Date.now());

  if (!isAuthed) {
    // Redirige a la entrada de PIN — la página verifica si el PIN existe
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Excluye estáticos de Next y cualquier archivo con extensión (iconos PWA,
  // manifest.json, etc.), evitando redirigir esas peticiones a /pin.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.[\\w]+$).*)",
  ],
};
