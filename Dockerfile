# syntax=docker/dockerfile:1

# --- deps: install from the lockfile ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# --- build: Next standalone output ---
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BACKEND_URL is required by next.config.ts at build AND server start.
# The build-time value only needs to parse; the real one is injected at runtime.
ARG BACKEND_URL=http://localhost:8000
ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime: standalone server only ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build --chown=nextjs:nextjs /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
