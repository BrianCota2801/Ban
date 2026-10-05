import { NextResponse, type NextRequest } from "next/server";

// Revisión rápida: sin cookie de sesión no se entra al panel ni a la cuenta.
// La verificación real (sesión válida y rol de admin) se hace en el servidor en cada página y acción.
export function proxy(req: NextRequest) {
  if (!req.cookies.has("ban_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/cuenta/:path*"] };
