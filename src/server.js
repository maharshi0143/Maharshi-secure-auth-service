// src/server.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { decryptSeed } from "./crypto-utils.js";
import { generateTotpCode, verifyTotpCode, getTotpValidForSeconds } from "./totp-utils.js";

const app = express();
app.use(express.json());

// Resolve paths in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seed file path (overridable via env in Docker)
const SEED_FILE_PATH = process.env.SEED_FILE_PATH || path.join(__dirname, "..", "data", "seed.txt");

// Ensure seed directory exists (for local dev)
function ensureSeedDir() {
  const dir = path.dirname(SEED_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Helpers
function seedFileExists() {
  return fs.existsSync(SEED_FILE_PATH);
}
function readHexSeedFromFile() {
  if (!seedFileExists()) throw new Error("Seed file not found");
  return fs.readFileSync(SEED_FILE_PATH, "utf8").trim();
}

/**
 * POST /decrypt-seed
 * Body: { "encrypted_seed": "BASE64..." }
 */
app.post("/decrypt-seed", (req, res) => {
  const { encrypted_seed } = req.body || {};
  if (!encrypted_seed || typeof encrypted_seed !== "string") {
    return res.status(400).json({ error: "encrypted_seed is required" });
  }

  try {
    const hexSeed = decryptSeed(encrypted_seed); // crypto-utils.js must export decryptSeed
    if (!hexSeed || hexSeed.length !== 64 || !/^[0-9a-f]{64}$/i.test(hexSeed)) {
      throw new Error("Decrypted seed is not a valid 64-character hex string");
    }

    ensureSeedDir();
    fs.writeFileSync(SEED_FILE_PATH, hexSeed + "\n", "utf8");
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Error in /decrypt-seed:", err.message);
    return res.status(500).json({ error: "Decryption failed" });
  }
});

/**
 * GET /generate-2fa
 * Response: { code, valid_for }
 */
app.get("/generate-2fa", (req, res) => {
  try {
    if (!seedFileExists()) return res.status(500).json({ error: "Seed not decrypted yet" });
    const hexSeed = readHexSeedFromFile();
    const code = generateTotpCode(hexSeed);
    const valid_for = getTotpValidForSeconds();
    return res.status(200).json({ code, valid_for });
  } catch (err) {
    console.error("Error in /generate-2fa:", err.message);
    return res.status(500).json({ error: "Seed not decrypted yet" });
  }
});

/**
 * POST /verify-2fa
 * Body: { code }
 * Response: { valid: true|false }
 */
app.post("/verify-2fa", (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    if (!seedFileExists()) return res.status(500).json({ error: "Seed not decrypted yet" });
    const hexSeed = readHexSeedFromFile();
    const isValid = verifyTotpCode(hexSeed, code, 1);
    console.log("---- /verify-2fa ----");
    console.log("Received code:", code);
    console.log("Hex seed:", hexSeed);
    console.log("Verification result:", isValid);
    return res.status(200).json({ valid: isValid });
  } catch (err) {
    console.error("Error in /verify-2fa:", err.message);
    return res.status(500).json({ error: "Seed not decrypted yet" });
  }
});

/**
 * GET /debug-2fa
 * Generates + immediately verifies a TOTP internally (useful for debugging)
 */
app.get("/debug-2fa", (req, res) => {
  try {
    if (!seedFileExists()) return res.status(500).json({ error: "Seed not decrypted yet" });
    const hexSeed = readHexSeedFromFile();
    const code = generateTotpCode(hexSeed);
    const valid_for = getTotpValidForSeconds();
    const internal_verify = verifyTotpCode(hexSeed, code, 1);
    console.log("---- /debug-2fa ----", { hexSeed, code, internal_verify });
    return res.status(200).json({ hexSeed, code, valid_for, internal_verify });
  } catch (err) {
    console.error("Error in /debug-2fa:", err.message);
    return res.status(500).json({ error: "Seed not decrypted yet" });
  }
});

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Print registered routes after the current event loop turn so Express has registered them
function printRoutes() {
  console.log("Registered routes:");
  if (!app._router) {
    console.log("No router found on app");
    return;
  }
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(",").toUpperCase();
      console.log(`${methods} ${m.route.path}`);
    }
  });
}
setImmediate(printRoutes);

// Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth service listening on port ${PORT}`);
});
