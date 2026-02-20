/**
 * Post-deploy smoke tests
 * Verifies health endpoints and frontend availability
 */

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface SmokeTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function smokeTest(
  name: string,
  test: () => Promise<void>
): Promise<SmokeTestResult> {
  const start = Date.now();
  try {
    await test();
    return { name, passed: true, duration: Date.now() - start };
  } catch (error) {
    return {
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function runSmokeTests(): Promise<void> {
  console.log('Running smoke tests...\n');
  
  const tests: SmokeTestResult[] = [];

  // Test 1: Backend root health
  tests.push(
    await smokeTest('Backend root endpoint', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
    })
  );

  // Test 2: Backend /health
  tests.push(
    await smokeTest('Backend /health endpoint', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/health`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok') throw new Error('Invalid health status');
    })
  );

  // Test 3: Backend /health/ready
  tests.push(
    await smokeTest('Backend /health/ready endpoint', async () => {
      const response = await fetchWithTimeout(`${BASE_URL}/health/ready`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
    })
  );

  // Test 4: Frontend availability
  tests.push(
    await smokeTest('Frontend availability', async () => {
      const response = await fetchWithTimeout(FRONTEND_URL);
      if (!response.ok) throw new Error(`Status ${response.status}`);
    })
  );

  // Print results
  console.log('Results:');
  console.log('--------');
  tests.forEach((test) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name} (${test.duration}ms)`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;
  console.log(`\nTotal: ${tests.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests();
