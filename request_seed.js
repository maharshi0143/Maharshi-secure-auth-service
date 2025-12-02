// request_seed.js
import fs from "fs";
import axios from "axios";

// 🔐 Your config
const STUDENT_ID = "24A95A6104";
const GITHUB_REPO_URL = "https://github.com/maharshi0143/Maharshi-secure-auth-service";
const INSTRUCTOR_API_URL = "https://eajeyq4r3zljoq4rpovy2nthda0vtjqf.lambda-url.ap-south-1.on.aws/";

// Read student_public.pem as a valid PEM (with real newlines)
function getPublicKeyPem() {
  let pem = fs.readFileSync("student_public.pem", "utf8").trim();

  // Ensure it ends with a newline
  if (!pem.endsWith("\n")) {
    pem += "\n";
  }

  return pem;
}

async function requestSeed() {
  try {
    const publicKeyPem = getPublicKeyPem();

    console.log("Sending request to instructor API with:");
    console.log("student_id:", STUDENT_ID);
    console.log("github_repo_url:", GITHUB_REPO_URL);
    console.log("url:", INSTRUCTOR_API_URL);

    const payload = {
      student_id: STUDENT_ID,
      github_repo_url: GITHUB_REPO_URL,
      public_key: publicKeyPem
    };

    const response = await axios.post(INSTRUCTOR_API_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    });

    if (response.data.status !== "success" || !response.data.encrypted_seed) {
      console.error("Unexpected response from instructor API:", response.data);
      process.exit(1);
    }

    const encryptedSeed = response.data.encrypted_seed;
    fs.writeFileSync("encrypted_seed.txt", encryptedSeed, "utf8");

    console.log("✅ Encrypted seed received and saved to encrypted_seed.txt");
  } catch (err) {
    console.error("❌ Failed to request encrypted seed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

requestSeed();
