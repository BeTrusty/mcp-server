# =============================================================================
# Dockerfile para BeTrusty MCP Server - Optimizado para Railway
# =============================================================================
# Usa pnpm para install, Bun para build y runtime
# Build: 2026-03-06

# --- Base con Node + pnpm + Bun ---
FROM node:22-alpine AS base

# Instalar pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Instalar Bun
RUN apk add --no-cache bash curl unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && mv /root/.bun/bin/bun /usr/local/bin/

WORKDIR /app

# --- Etapa de Dependencias ---
FROM base AS deps

# Copiamos archivos de configuración del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copiamos package.json de todos los paquetes para resolver el grafo de workspaces
COPY packages/ ./packages/
COPY apps/mcp-server/package.json ./apps/mcp-server/
RUN find packages -type f ! -name 'package.json' -delete

# Instalamos dependencias con pnpm
RUN pnpm install --frozen-lockfile

# --- Etapa de Build ---
FROM base AS builder
WORKDIR /app

# Copiamos todo desde la etapa de deps (incluyendo node_modules vinculados)
COPY --from=deps /app ./

# Copiamos el código fuente real
COPY packages ./packages
COPY apps/mcp-server ./apps/mcp-server

# Build con pnpm
RUN pnpm --filter=@gym/mcp-server build

# --- Etapa Final (Runner con Bun) ---
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser
USER bunuser

# Copiamos solo lo necesario para producción
COPY --from=builder --chown=bunuser:nodejs /app/apps/mcp-server/dist ./dist
COPY --from=builder --chown=bunuser:nodejs /app/node_modules ./node_modules

# Variables de entorno
ENV NODE_ENV=production

# Puerto por defecto
EXPOSE 3002

# Healthcheck para Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3002}/health || exit 1

# Runtime con Bun
CMD ["bun", "run", "dist/index.js"]
