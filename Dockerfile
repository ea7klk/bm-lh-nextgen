# Multi-stage build to reduce final image size
# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache sqlite wget

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Copy node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create data directory and set permissions
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app

# Create entrypoint script to handle environment variables
COPY --chown=nodejs:nodejs <<EOF /app/entrypoint.sh
#!/bin/sh
# Generate .env file from environment variables if it does not exist
if [ ! -f /app/.env ]; then
    echo "PORT=\${PORT:-3000}" > /app/.env
    echo "DB_PATH=\${DB_PATH:-./data/lastheard.db}" >> /app/.env
    echo "ADMIN_PASSWORD=\${ADMIN_PASSWORD:-changeme}" >> /app/.env
    echo "JWT_SECRET=\${JWT_SECRET:-your-secret-key-here}" >> /app/.env
    echo "EMAIL_ENABLED=\${EMAIL_ENABLED:-false}" >> /app/.env
    echo "SMTP_HOST=\${SMTP_HOST:-smtp.gmail.com}" >> /app/.env
    echo "SMTP_PORT=\${SMTP_PORT:-587}" >> /app/.env
    echo "SMTP_SECURE=\${SMTP_SECURE:-false}" >> /app/.env
    echo "SMTP_USER=\${SMTP_USER:-}" >> /app/.env
    echo "SMTP_PASS=\${SMTP_PASS:-}" >> /app/.env
    echo "EMAIL_FROM=\${EMAIL_FROM:-noreply@example.com}" >> /app/.env
    echo "EMAIL_INTERVAL=\${EMAIL_INTERVAL:-24}" >> /app/.env
    echo "PAGINATION_SIZE=\${PAGINATION_SIZE:-25}" >> /app/.env
    echo "SWAGGER_ENABLED=\${SWAGGER_ENABLED:-true}" >> /app/.env
fi
exec "\$@"
EOF

RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "src/server.js"]