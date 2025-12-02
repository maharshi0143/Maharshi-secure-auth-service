import fs from "fs";
import crypto from "crypto";

const PRIVATE_KEY_PATH = "student_private.pem";

// Load private key
export function loadPrivateKey() {
  return fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
}

// Validate 64-char hex string
function validateHexSeed(seed) {
  if (seed.length !== 64 || !/^[0-9a-f]+$/.test(seed)) {
    throw new Error("Invalid decrypted seed format");
  }
}

// Decrypt encrypted seed (Base64 → RSA-OAEP → hex)
export function decryptSeed(encryptedSeedB64) {
  const privateKey = loadPrivateKey();

  // Base64 decode
  const encryptedBuffer = Buffer.from(encryptedSeedB64.trim(), "base64");

  // RSA-OAEP decrypt using SHA-256
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    encryptedBuffer
  );

  const seed = decryptedBuffer.toString("utf8").trim().toLowerCase();

  // Validate 64-character hex
  validateHexSeed(seed);

  return seed;
}
