#!/bin/bash
FILES=(
  "backend/tests/contracts/response-snapshots.test.ts"
  "backend/tests/fixtures/macro-responses.ts"
  "backend/src/middleware/clerk-auth.ts"
  "backend/src/db/schema.ts"
  "backend/src/modules/goals/routes.ts"
  "backend/src/modules/user/routes.ts"
  "backend/src/modules/auth/routes.ts"
  "backend/src/modules/macros/target-routes.ts"
  "frontend/src/features/auth/components/ResetPasswordForm.tsx"
  "frontend/src/features/auth/pages/ResetPasswordPage.tsx"
  "frontend/src/features/auth/hooks/useResetPassword.ts"
  "frontend/src/features/reporting/pages/ReportingPage.tsx"
  "backend/src/lib/clerk-utils.ts"
  "backend/src/lib/database.ts"
  "backend/src/lib/route-adapter.ts"
  "backend/src/lib/logger.ts"
  "backend/src/services/openfoodfacts-api-client.ts"
  "backend/src/app.ts"
  "backend/src/modules/reporting/index.ts"
  "backend/src/modules/macros/entry-routes.ts"
  "backend/src/middleware/clerk-guards.ts"
  "frontend/src/api/core.ts"
  "frontend/src/api/macros.ts"
  "frontend/src/api/goals.ts"
  "frontend/src/api/habits.ts"
  "frontend/src/features/settings/utils/calculations.ts"
  "frontend/src/features/landing/components/remotion/DashboardAnimation.tsx"
  "frontend/package.json"
  "backend/src/lib/password.ts"
  "backend/src/middleware/correlation.ts"
  "backend/src/utils/id-generator.ts"
  "backend/package.json"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "[EXIST] $file"
  else
    echo "[MISSING] $file"
  fi
done
