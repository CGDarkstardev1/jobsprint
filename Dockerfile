# Multi-stage build for Jobsprint Application

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Build application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/frontend ./src/frontend

# Create non-root user
RUN addgroup -g 1001 -S jobsprint && \
    adduser -S jobsprint -u 1001 -G jobsprint

# Change ownership
RUN chown -R jobsprint:jobsprint /app

# Switch to non-root user
USER jobsprint

# Expose ports
EXPOSE 3000 5678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["node", "dist/backend/api/server.js"]
