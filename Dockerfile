# syntax=docker/dockerfile:1.6

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app

# libc6-compat helps some native modules; tini for proper signal handling at runtime stage too
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --include=optional

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV HOME=/home/nextjs

RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs -h /home/nextjs nextjs

# Public assets and standalone server
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# pdf-parse / pdfjs-dist / claude-agent-sdk are externalized — copy node_modules so they resolve at runtime
COPY --from=deps   --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint that materializes Claude OAuth credentials at startup
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# PDF folder (mount a volume here in production)
RUN mkdir -p /app/pdfs && chown nextjs:nodejs /app/pdfs
VOLUME ["/app/pdfs"]

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
