import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/manifest.webmanifest",
  "/sw.js",
])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/assets/")

  if (!isPublic && !request.cookies.get("access_token")?.value) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|task-buddy-icon.svg|apple-touch-icon.png).*)",
  ],
}
