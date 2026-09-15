import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Gates every page on a valid session. This app stores blood pressure readings
 * and medical notes, so the default is closed and routes opt out explicitly.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /setup guards itself against the database: it is only reachable while no
  // account exists, which the edge runtime cannot check.
  if (pathname === "/login" || pathname === "/setup") {
    return NextResponse.next();
  }

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  // Send the coach back where they were headed once signed in.
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
