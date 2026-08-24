import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":", 1)[0];

  if (hostname === "project.jellewijma.com") {
    return NextResponse.rewrite(new URL("/workshop", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
