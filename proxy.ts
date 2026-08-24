import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":", 1)[0];
  const isUnknownSubdomain =
    hostname?.endsWith(".jellewijma.com") && hostname !== "www.jellewijma.com" && hostname !== "admin.jellewijma.com";

  if (isUnknownSubdomain && request.nextUrl.pathname !== "/_domain-not-found") {
    return NextResponse.rewrite(new URL("/_domain-not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|assets|workshop-og.png|favicon.ico).*)",
};
