import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = { params: Promise<{ path: string[] }> };

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const endpoint = path.join("/");
  const allowed = request.method === "POST"
    ? endpoint === "info" || endpoint === "jobs"
    : /^(jobs\/[a-f0-9]{64})$/.test(endpoint);
  if (!allowed) return failure("This download request is not supported.", 404);

  const origin = request.headers.get("origin");
  const allowedOrigins = new Set([
    request.nextUrl.origin,
    `${request.nextUrl.protocol}//${request.headers.get("host")}`,
    "https://jellewijma.com",
    "https://www.jellewijma.com",
  ]);
  if (origin && !allowedOrigins.has(origin)) {
    return failure("Open the downloader on jellewijma.com and try again.", 403);
  }

  // Vercel injects a short-lived, signed token for this deployment on every request.
  // Local development can use the service's shared key instead.
  const key = process.env.DOWNLOADVIDEO_API_KEY;
  const token = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-oidc-token")
    : key;
  const base = process.env.DOWNLOADVIDEO_BACKEND_URL || "https://appa.tailf12edd.ts.net/downloadvideo-backend";
  if (!token) return failure("The downloader is temporarily unavailable. Please try again later.", 503);

  let body: string | undefined;
  if (request.method === "POST") {
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return failure("Send a YouTube link using the form.", 415);
    }
    const reader = request.body?.getReader();
    if (!reader) return failure("Enter a YouTube link first.", 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.length;
        if (length > 4096) {
          await reader.cancel();
          return failure("That link is too long. Paste a single YouTube video link.", 413);
        }
        chunks.push(next.value);
      }
      body = Buffer.concat(chunks).toString("utf8");
      JSON.parse(body);
    } catch {
      return failure("The request could not be read. Please try again.", 400);
    }
  }

  // Vercel sets this header at its edge. Send a hash rather than retaining visitor IPs.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") || "local";
  const client = createHash("sha256").update(`downloadvideo:${ip}`).digest("hex");
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/${endpoint}`, {
      method: request.method,
      body,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Downloader-Client": client,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(request.method === "POST" ? 55000 : 20000),
    });
    if (!response.headers.get("content-type")?.includes("application/json")) {
      return failure("The download server is temporarily unavailable. Please try again.", 502);
    }
    const payload = await response.json();
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) headers["Retry-After"] = retryAfter;
    return NextResponse.json(payload, { status: response.status, headers });
  } catch {
    return failure("The download server took too long to respond. Please try again.", 504);
  }
}

export const POST = forward;
export const GET = forward;
export const DELETE = forward;
