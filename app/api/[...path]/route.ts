import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000"

const FORWARD_HEADERS = [
  "content-type",
  "authorization",
  "x-idempotency-key",
  "accept",
  "if-match",
  "prefer",
  // Trusted proxy chain: Vercel (prod) overwrites x-forwarded-for with the
  // real client IP before this handler runs; local dev is single-user.
  "x-forwarded-for",
]

const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "cache-control",
  "etag",
  "www-authenticate",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "retry-after",
]

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params
  const backendPath = `/api/${path.join("/")}${request.nextUrl.search}`

  const headers = new Headers()
  const cookie = request.headers.get("cookie")
  if (cookie) headers.set("cookie", cookie)
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  const upstream = await fetch(BACKEND_URL + backendPath, {
    method: request.method,
    headers,
    body,
    redirect: "follow",
  })

  const responseHeaders = new Headers()
  for (const [name, value] of upstream.headers) {
    if (name.toLowerCase() === "set-cookie") {
      responseHeaders.append("set-cookie", value)
    } else if (FORWARD_RESPONSE_HEADERS.includes(name.toLowerCase())) {
      responseHeaders.set(name, value)
    }
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS }
