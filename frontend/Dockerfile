# Production Dockerfile for Taska Frontend (Next.js)
# Multi-stage build for optimized production image

# Builder stage - install all deps (including devDeps) and build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files and install ALL dependencies (devDeps needed for Next.js build)
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application (standalone includes necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start application with dumb-init
# Override HOSTNAME to 0.0.0.0 so Next.js binds to all interfaces (not just container IP)
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
