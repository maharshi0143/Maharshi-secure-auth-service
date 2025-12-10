// src/totp-utils.js
import crypto from "crypto";

const TOTP_STEP_SECONDS = 30;   // 30-second window
const TOTP_DIGITS = 6;          // 6-digit codes

// Convert current time to TOTP counter
function getCounter(timestampMs = Date.now()) {
  return Math.floor(timestampMs / 1000 / TOTP_STEP_SECONDS);
}

// Generate a TOTP code from a hex seed
export function generateTotpCode(hexSeed, timestampMs = Date.now()) {
  if (!hexSeed || typeof hexSeed !== "string") {
    throw new Error("hexSeed is required");
  }

  const key = Buffer.from(hexSeed.trim(), "hex");
  const counter = getCounter(timestampMs);

  // 8-byte buffer for counter (big-endian)
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buf).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const codeInt = binCode % 10 ** TOTP_DIGITS;
  const codeStr = codeInt.toString().padStart(TOTP_DIGITS, "0");

  return codeStr;
}

// Verify a TOTP code within a ±window of time-steps
export function verifyTotpCode(hexSeed, code, window = 1, timestampMs = Date.now()) {
  if (!hexSeed || typeof hexSeed !== "string") return false;

  const normalized = String(code ?? "").trim();
  if (!/^\d{6}$/.test(normalized)) return false;

  const baseCounter = getCounter(timestampMs);

  // Check current, previous, next step
  for (let w = -window; w <= window; w++) {
    const candidate = generateTotpCode(
      hexSeed,
      timestampMs + w * TOTP_STEP_SECONDS * 1000
    );
    if (candidate === normalized) {
      return true;
    }
  }

  return false;
}

// How many seconds the current code is still valid for
export function getTotpValidForSeconds(timestampMs = Date.now()) {
  const nowSec = timestampMs / 1000;
  const stepStart = Math.floor(nowSec / TOTP_STEP_SECONDS) * TOTP_STEP_SECONDS;
  const elapsed = nowSec - stepStart;
  const remaining = TOTP_STEP_SECONDS - elapsed;
  return Math.max(0, Math.ceil(remaining));
}
