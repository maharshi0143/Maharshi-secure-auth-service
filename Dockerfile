# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install build-time dependencies (if any)
# Copy package files first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --production

# Copy app source
COPY . .

# Stage 2: Runtime
FROM node:20-slim AS runtime

# Ensure non-interactive apt
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Set working dir
WORKDIR /app

# Install runtime system deps: cron and tzdata
RUN apt-get update \
  && apt-get install -y --no-install-recommends cron tzdata ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Configure timezone explicitly to UTC
RUN ln -sf /usr/share/zoneinfo/UTC /etc/localtime && echo "UTC" > /etc/timezone

# Copy node_modules from builder to runtime
COPY --from=builder /app/node_modules ./node_modules

# Copy application code (exclude node_modules which is already copied)
COPY --from=builder /app ./

# Ensure scripts are executable
RUN chmod +x ./entrypoint.sh
RUN chmod +x ./scripts/decrypt_seed.js
RUN chmod 0644 ./cron/2fa-cron

# Create persistent mount directories and set permissions
RUN mkdir -p /data /cron \
  && chown -R root:root /data /cron \
  && chmod 755 /data /cron

# Expose port (for documentation)
EXPOSE 8080

# Entrypoint - starts cron and the node server
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "src/server.js"]
