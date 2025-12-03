# 1001 Stories Production Docker Image
# Multi-stage build for optimized container size and security

# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Security: Update packages and add required dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    wget && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Security: Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files with proper ownership
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs prisma ./prisma/

# Install dependencies with cache optimization (as root first)
RUN npm ci --only=production --no-audit --no-fund --legacy-peer-deps && \
    npm cache clean --force

# Switch to non-root user after dependency installation
USER nextjs

# Stage 1.5: Development dependencies for build
FROM node:20-alpine AS build-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including dev dependencies
RUN npm ci --no-audit --no-fund --legacy-peer-deps && npm cache clean --force

# Generate Prisma client in build-deps stage (with CDN fallback handling)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate || echo "Prisma generate failed, will use pre-generated client"

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Security: Update and install build essentials
RUN apk add --no-cache libc6-compat python3 make g++

# Build arguments for API keys (required for build)
ARG OPENAI_API_KEY

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Security: Create build user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy dependencies from build-deps stage with proper ownership
COPY --from=build-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .

# Create necessary directories and ensure ownership (optimized - only specific dirs)
RUN mkdir -p .next && chown nextjs:nodejs .next

# Switch to non-root user for build
USER nextjs

# Generate Prisma client (ignore checksum errors for temporary server issues)
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npx prisma generate

# Build application with optimization
RUN npm run build && \
    npm prune --production --legacy-peer-deps

# Stage 3: Production runner
FROM node:20-alpine AS runner

# Security: Update packages and install minimal runtime dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    wget \
    tzdata && \
    rm -rf /var/cache/apk/*

# Security: Create non-root user with specific IDs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma Client from builder (includes binaries)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/locales ./locales

# Create necessary directories with proper permissions
RUN mkdir -p uploads tmp public/generated-images public/covers public/books

# Security: Remove write permissions from application files (before setting writable dirs)
RUN find /app -type f -exec chmod 644 {} + && \
    find /app -type d -exec chmod 755 {} + && \
    chmod +x /app/server.js && \
    chmod +x /app/node_modules/@prisma/engines/schema-engine-* 2>/dev/null || true && \
    chmod +x /app/node_modules/@prisma/engines/query-engine-* 2>/dev/null || true

# Set writable directories AFTER the find commands to prevent permission override
RUN chown -R nextjs:nodejs uploads tmp public/generated-images public/covers public/books && \
    chmod 775 uploads tmp public/generated-images public/covers public/books

# Security: Switch to non-root user
USER nextjs

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:3000/api/health || exit 1

# Expose port (non-privileged)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_CACHE=/tmp/.npm

# Security: Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]