import { fileURLToPath } from "node:url";
import { defineConfig } from 'vitest/config'

process.env.JWT_SECRET = "test_jwt_secret_must_be_long_enough_32_chars";
process.env.STRIPE_SECRET_KEY = "test_stripe_key";
process.env.STRIPE_WEBHOOK_SECRET = "test_stripe_webhook_secret";
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly";
process.env.STRIPE_PRICE_ID_YEARLY = "price_yearly";
process.env.RESEND_API_KEY = "test_resend_api_key_placeholder";
process.env.CLERK_PUBLISHABLE_KEY = "pk_test_123";
process.env.CLERK_SECRET_KEY = "sk_test_123";
process.env.NODE_ENV = "test";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      JWT_SECRET: "test_jwt_secret_must_be_long_enough_32_chars",
      STRIPE_SECRET_KEY: "test_stripe_key",
      STRIPE_WEBHOOK_SECRET: "test_stripe_webhook_secret",
      STRIPE_PRICE_ID_MONTHLY: "price_monthly",
      STRIPE_PRICE_ID_YEARLY: "price_yearly",
      RESEND_API_KEY: "test_resend_api_key_placeholder",
      CLERK_PUBLISHABLE_KEY: "pk_test_123",
      CLERK_SECRET_KEY: "sk_test_123",
      NODE_ENV: "test"
    },
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tests/contracts/*.integration.test.ts', 'tests/contracts/elysia-integration.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/**/*.test.ts',
        '*.config.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
