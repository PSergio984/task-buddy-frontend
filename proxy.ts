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

const STATIC_ASSET_RE = /\.(png|jpg|jpeg|svg|ico|webp|avif|woff2?|ttf|otf|eot|css|js|json)$/

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/api/") ||
    STATIC_ASSET_RE.test(pathname)

  if (!isPublic && !request.cookies.get("access_token")?.value) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|task-buddy-icon.svg|apple-touch-icon.png).*)"],
}
