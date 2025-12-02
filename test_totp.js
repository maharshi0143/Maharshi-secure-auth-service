import fs from "fs";
import { generateTotpCode, verifyTotpCode, getTotpValidForSeconds } from "./src/totp-utils.js";

const hexSeed = fs.readFileSync("data/seed.txt", "utf8").trim();

const code = generateTotpCode(hexSeed);
const validFor = getTotpValidForSeconds();

console.log("Generated TOTP Code:", code);
console.log("Valid for (seconds):", validFor);

const isValid = verifyTotpCode(hexSeed, code, 1);
console.log("Is code valid (±30s window)?", isValid);
