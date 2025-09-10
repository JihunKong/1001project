# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
# Don't set NODE_ENV=production during build to allow Tailwind to scan files properly

# Generate Prisma Client (only the client, skip other generators)
RUN npx prisma generate --generator client

# Install sharp with optimized build for Alpine Linux
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --platform=linux --arch=x64 --libc=musl sharp --legacy-peer-deps \
    && apk del .build-deps

# Build application
RUN npm run build


# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and locales
COPY --from=builder /app/public ./public
COPY --from=builder /app/locales ./locales

# Copy standalone build (includes server.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]