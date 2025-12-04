#!/usr/bin/env node

import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import crypto from "crypto";

const ROOT = process.cwd();

// 1. Get the latest commit hash
function getLatestCommitHash() {
  const hash = execSync("git log -1 --format=%H").toString().trim();
  if (!/^[0-9a-fA-F]{40}$/.test(hash)) throw new Error("Invalid commit hash: " + hash);
  return hash;
}

// 2. Load student private key (from project root)
function loadPrivateKey() {
  return fs.readFileSync(path.join(ROOT, "student_private.pem"), "utf-8");
}

// 3. Sign using RSA-PSS-SHA256
function signCommitHash(commitHash, privateKeyPem) {
  const signer = crypto.createSign("sha256");
  signer.update(commitHash, "utf8");  // ASCII bytes
  signer.end();

  return signer.sign({
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX
  });
}

// 4. Load instructor public key (from project root)
function loadInstructorPublicKey() {
  return fs.readFileSync(path.join(ROOT, "instructor_public.pem"), "utf-8");
}

// 5. Encrypt signature using RSA-OAEP-SHA256
function encryptSignature(signatureBytes, publicKeyPem) {
  return crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    signatureBytes
  );
}

// MAIN
try {
  const commitHash = getLatestCommitHash();
  const studentPrivateKey = loadPrivateKey();
  const instructorPubKey = loadInstructorPublicKey();

  const signature = signCommitHash(commitHash, studentPrivateKey);
  const encrypted = encryptSignature(signature, instructorPubKey);

  const proofBase64 = encrypted.toString("base64");

  console.log("Commit Hash:", commitHash);
  console.log("Encrypted Signature:", proofBase64);

} catch (err) {
  console.error("ERROR:", err.message);
  process.exit(1);
}
