#!/usr/bin/env node
// scripts/log_2fa_cron.js
import fs from "fs";
import path from "path";
import { generateTotpCode } from "../src/totp-utils.js";

// Paths (mounted volumes)
const SEED_PATH = process.env.SEED_FILE_PATH || "/data/seed.txt";
const LOG_PATH = "/cron/last_code.txt";

function utcTimestamp() {
  const d = new Date();
  // Format YYYY-MM-DD HH:MM:SS in UTC
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

try {
  if (!fs.existsSync(SEED_PATH)) {
    const err = `${utcTimestamp()} - ERROR: seed file not found at ${SEED_PATH}\n`;
    fs.appendFileSync(LOG_PATH, err);
    process.exit(1);
  }

  const hexSeed = fs.readFileSync(SEED_PATH, "utf8").trim();
  if (!hexSeed || hexSeed.length !== 64) {
    const err = `${utcTimestamp()} - ERROR: invalid seed: ${hexSeed}\n`;
    fs.appendFileSync(LOG_PATH, err);
    process.exit(1);
  }

  const code = generateTotpCode(hexSeed);
  const line = `${utcTimestamp()} - 2FA Code: ${code}\n`;
  fs.appendFileSync(LOG_PATH, line);
  process.exit(0);
} catch (err) {
  const line = `${utcTimestamp()} - ERROR: ${err?.message || err}\n`;
  try { fs.appendFileSync(LOG_PATH, line); } catch (_) {}
  process.exit(1);
}
