import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const backendUrl = process.env.BACKEND_URL

if (!backendUrl || !/^https?:\/\//.test(backendUrl)) {
  throw new Error("BACKEND_URL is required and must be an http(s) URL")
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
}

export default withSerwist(nextConfig)
