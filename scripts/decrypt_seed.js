#!/usr/bin/env node
// scripts/decrypt_seed.js
import fs from "fs";
import crypto from "crypto";

const ENCRYPTED_SEED_PATH = process.env.ENCRYPTED_SEED_PATH || "/data/encrypted_seed.txt";
const PRIVATE_KEY_PATH = "/app/student_private.pem";
const OUTPUT_SEED_PATH = "/data/seed.txt";

try {
  // Check if plain seed already exists
  if (fs.existsSync(OUTPUT_SEED_PATH)) {
    console.log("Plain seed.txt already exists, skipping decryption");
    process.exit(0);
  }

  // Read encrypted seed (base64)
  const encryptedSeedBase64 = fs.readFileSync(ENCRYPTED_SEED_PATH, "utf8").trim();
  const encryptedSeed = Buffer.from(encryptedSeedBase64, "base64");

  // Read private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");

  // Decrypt using RSA private key
  const decryptedSeed = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedSeed
  );

  // Convert to hex string (should be 64 chars)
  const hexSeed = decryptedSeed.toString("utf8").trim();

  // Validate
  if (hexSeed.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hexSeed)) {
    throw new Error(`Invalid decrypted seed: ${hexSeed}`);
  }

  // Write to output
  fs.writeFileSync(OUTPUT_SEED_PATH, hexSeed, "utf8");
  console.log("✅ Seed decrypted successfully to /data/seed.txt");

  process.exit(0);
} catch (err) {
  console.error("❌ ERROR decrypting seed:", err.message);
  process.exit(1);
}