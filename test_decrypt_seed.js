import fs from "fs";
import { decryptSeed } from "./src/crypto-utils.js";

const encrypted = fs.readFileSync("encrypted_seed.txt", "utf8").trim();

try {
  const seed = decryptSeed(encrypted);
  console.log("Decrypted Hex Seed:", seed);
  console.log("Length:", seed.length);

  // Save locally for testing
  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync("data/seed.txt", seed);
  console.log("Saved to data/seed.txt");
} catch (err) {
  console.error("Decryption failed:", err.message);
}
