const baseUrl = process.env.PRODUCTION_API_URL;

if (!baseUrl) {
  console.error("ERROR: PRODUCTION_API_URL is not set.");
  process.exit(1);
}

const endpoints = [
  "/health",
  "/operations/overview",
  "/equipment/C-104/intelligence",
  "/equipment/C-104/risk",
  "/equipment/C-104/failure-modes",
  "/equipment/C-104/maintenance-recommendations",
  "/equipment/C-104/predict",
  "/predict/ml/info",
  "/predict/ml/validation",
];

let failed = false;

for (const endpoint of endpoints) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);

    if (!response.ok) {
      console.error(`FAIL ${response.status}: ${endpoint}`);
      failed = true;
      continue;
    }

    console.log(`PASS ${response.status}: ${endpoint}`);
  } catch (error) {
    console.error(`FAIL: ${endpoint}`);
    console.error(error.message);
    failed = true;
  }
}

if (failed) {
  console.error("\nProduction smoke test FAILED.");
  process.exit(1);
}

console.log("\nProduction smoke test PASSED.");
