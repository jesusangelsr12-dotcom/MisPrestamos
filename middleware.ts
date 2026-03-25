import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/pin", "/setup-pin", "/api/pin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".json")
  ) {
    return NextResponse.next();
  }

  const isAuthed = request.cookies.get("cuotas_auth")?.value === "true";

  if (!isAuthed) {
    // Redirect to PIN entry — the page itself will check if PIN exists
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
