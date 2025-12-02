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
  const base32Seed = hexToBase32(hexSeed);

  return totp.verify({
    token: code,
    secret: base32Seed,
    window: validWindow
  });
}

export function getTotpValidForSeconds() {
  const step = 30;
  const now = Math.floor(Date.now() / 1000);
  return step - (now % step);
}
