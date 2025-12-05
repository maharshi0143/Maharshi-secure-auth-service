#!/bin/sh
set -e

# Ensure /data and /cron exist
mkdir -p /data /cron
chmod 755 /data /cron

# Configure timezone (UTC)
if [ -f /usr/share/zoneinfo/UTC ]; then
  ln -sf /usr/share/zoneinfo/UTC /etc/localtime
  echo "UTC" > /etc/timezone
fi
export TZ=UTC

# Decrypt seed if encrypted_seed.txt exists
if [ -f /data/encrypted_seed.txt ]; then
  echo "Decrypting seed..."
  node /app/scripts/decrypt_seed.js
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to decrypt seed"
    exit 1
  fi
else
  echo "No encrypted seed found, assuming plain seed.txt exists"
fi

# Normalize CRLF → LF for cron file (fixes Windows line-ending issue)
if [ -f /app/cron/2fa-cron ]; then
  sed -i 's/\r$//' /app/cron/2fa-cron
  crontab /app/cron/2fa-cron
  echo "Cron job installed successfully"
else
  echo "WARNING: /app/cron/2fa-cron not found"
fi

# Start cron daemon
if command -v cron >/dev/null 2>&1; then
  cron
  echo "Cron daemon started"
else
  echo "ERROR: cron not installed"
  exit 1
fi

# Start the application
exec "$@"
