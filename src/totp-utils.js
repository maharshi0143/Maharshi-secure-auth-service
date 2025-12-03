// src/totp-utils.js
import { totp } from "otplib";
import base32 from "hi-base32";

// Configure TOTP settings
totp.options = {
  digits: 6,
  step: 30,
  algorithm: "sha1"
};

function hexToBase32(hexSeed) {
  if (!hexSeed || hexSeed.length !== 64 || !/^[0-9a-f]+$/i.test(hexSeed)) {
    throw new Error("hexSeed must be a 64-character hex string");
  }

  const seedBytes = Buffer.from(hexSeed, "hex");
  const base32Seed = base32.encode(seedBytes).replace(/=+$/g, ""); // remove '=' padding

  return base32Seed;
}

export function generateTotpCode(hexSeed) {
  const base32Seed = hexToBase32(hexSeed);
  return totp.generate(base32Seed);
}

export function verifyTotpCode(hexSeed, code, validWindow = 1) {
  if (!code) return false;

  // Normalize code: string, trimmed, remove spaces
  const normalizedCode = String(code).trim().replace(/\s+/g, "");

  // Must be exactly 6 digits
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const base32Seed = hexToBase32(hexSeed);

  return totp.verify({
    token: normalizedCode,
    secret: base32Seed,
    window: validWindow
  });
}

export function getTotpValidForSeconds() {
  const step = totp.options.step || 30; // 30s period
  const now = Math.floor(Date.now() / 1000);
  return step - (now % step);
}
