/**
 * Debug full login flow
 */

const http = require("http");

async function debug() {
  const BASE_URL = "http://localhost:3001";
  const tenantId = "11111111-1111-1111-1111-111111111111";

  console.log("Testing login endpoint...\n");

  const postData = JSON.stringify({
    email: "day3-test@example.com",
    password: "TestPassword123!",
  });

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path: "/api/kernel/iam/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "x-tenant-id": tenantId,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log("Status:", res.statusCode);
          console.log("Response:", data);
          resolve();
        });
      }
    );

    req.on("error", (e) => {
      console.error("Error:", e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

debug().catch(console.error);
