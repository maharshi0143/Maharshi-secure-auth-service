# Stage 1: Builder
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the rest of the app
COPY . .

# Stage 2: Runtime
FROM node:20-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

WORKDIR /app

# Install runtime dependencies: cron + tzdata + certs
RUN apt-get update \
  && apt-get install -y --no-install-recommends cron tzdata ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Configure timezone to UTC
RUN ln -sf /usr/share/zoneinfo/UTC /etc/localtime \
  && echo "UTC" > /etc/timezone

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app ./

# ---- IMPORTANT PART: fix line endings & permissions ----
RUN sed -i 's/\r$//' entrypoint.sh \
  && chmod +r entrypoint.sh \
  && chmod +x entrypoint.sh \
  && sed -i 's/\r$//' cron/2fa-cron \
  && chmod 0644 cron/2fa-cron \
  && chmod +x scripts/decrypt_seed.js || true

# Create directories for mounted volumes
RUN mkdir -p /data /cron \
  && chmod 755 /data /cron

EXPOSE 8080

# >>> KEY FIX: call entrypoint via 'sh' so CRLF/execute bit can't break it
ENTRYPOINT ["sh", "./entrypoint.sh"]
CMD ["node", "src/server.js"]
