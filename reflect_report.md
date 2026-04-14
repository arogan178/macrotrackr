## Coverage Ledger
- api_core_global_state -> cluster "frontend-api-standardization"
- api_core_silent_catch -> cluster "frontend-api-standardization"
- backend_error_contract_variation -> cluster "backend-routes-cleanup"
- backend_lib_flat_overload -> cluster "backend-lib-reorganization"
- backend_lib_hub_module -> cluster "backend-lib-reorganization"
- backend_services_domain_leak -> cluster "backend-architecture-refine"
- bun_sqlite_runtime_lockin_spread -> cluster "backend-architecture-refine"
- bypassed_auth_guards -> cluster "clerk-auth-cleanup"
- calc_param_mismatch -> cluster "frontend-components-cleanup"
- clerk_auth_fallback_bloat -> cluster "clerk-auth-cleanup"
- clerk_auth_silent_swallow -> cluster "clerk-auth-cleanup"
- frontend_horizontal_data_layer -> cluster "frontend-api-standardization"
- goals-routes-split -> cluster "backend-routes-cleanup"
- group_any -> cluster "backend-routes-cleanup"
- incompatible_route_responses -> cluster "backend-routes-cleanup"
- legacy_password_reset -> cluster "backend-routes-cleanup"
- missing_error_contracts -> cluster "frontend-api-standardization"
- mixed_param_styles -> cluster "frontend-api-standardization"
- nosy_debug_logging -> cluster "backend-routes-cleanup"
- record_cast_bypass -> cluster "backend-routes-cleanup"
- redundant_async_delay -> cluster "backend-lib-reorganization"
- redundant_bcrypt_package -> cluster "backend-dependency-cleanup"
- redundant_uuid_package -> cluster "backend-dependency-cleanup"
- remotion_heavy_dependency -> cluster "frontend-components-cleanup"
- reporting_export_inconsistency -> cluster "backend-architecture-refine"
- restating_comments -> cluster "backend-routes-cleanup"
- route_context_cast -> cluster "backend-routes-cleanup"
- route_context_manual_casting -> cluster "backend-routes-cleanup"
- route_flows_lack_direct_tests -> cluster "test-strategy-overhaul"
- snapshot_over_contracts -> cluster "test-strategy-overhaul"
- strict_middleware_order -> cluster "backend-architecture-refine"
- untested_critical_paths -> cluster "test-strategy-overhaul"

## Strategic Analysis
The most recurring dimensions are `ai_generated_debt` (3 issues), `dependency_health` (4 issues), `test_strategy` (3 issues), and `type_safety` (3 issues). The recurrence of `type_safety` and `ai_generated_debt` across backend route definitions shows a need for standardizing Elysia schema abstractions. The `dependency_health` dimension highlights an over-reliance on external libraries when native Bun alternatives exist. The `test_strategy` dimension confirms the need for proper test isolation instead of snapshot dependence. We address these systematically through grouped refactoring.

## Cluster Blueprint
Cluster "frontend-api-standardization"
Standardizes error contracts, parameter styles, and removes horizontal API slices in favor of feature-based ones. Addresses mutable state and silent catch blocks in the frontend core API.

Cluster "backend-routes-cleanup"
Standardizes Elysia contexts, response shapes, and error contracts across modules. Cleans up procedural noise like debug logging, redundant comments, casting overrides, and legacy password resets.

Cluster "backend-lib-reorganization"
Breaks up the overloaded `backend/src/lib/` hub module into focused subdirectories, and removes redundant async modifiers in database utils.

Cluster "backend-architecture-refine"
Addresses database lock-in spread, domain leaks in services, export consistency in modules, and strict middleware initialization constraints.

Cluster "clerk-auth-cleanup"
Simplifies fallbacks, fixes silent token swallowing, and standardizes decorators in the Clerk auth middleware.

Cluster "frontend-components-cleanup"
Fixes contract mismatches in calculation utility params and swaps out the heavy remotion dependency for motion in frontend animations.

Cluster "backend-dependency-cleanup"
Replaces redundant packages with Bun's built-in APIs to address the dependency health neglect.

Cluster "test-strategy-overhaul"
Adds critical direct endpoint and middleware tests, replacing unreliable snapshot tests with real assertions to improve test strategy metrics.

## Backlog Decisions
- auto/test_coverage-untested_module -> defer "Prioritize code quality and dependency cleanup first; defer test coverage to avoid locking in poor structural choices."
- auto/test_coverage-transitive_only -> defer "Same rationale as above; defer until structural stability is achieved."
- auto/stale_exclude -> promote "Actionable project hygiene fix with 0% false positive risk."

## Skip Decisions
No skips needed. All identified review issues are actionable and aligned with the architectural goals.