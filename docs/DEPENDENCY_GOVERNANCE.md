# Dependency Governance

This repository uses a Bun/Node workspace with separate frontend/backend packages.
To reduce tooling drift and accidental dependency sprawl, follow these rules.

## 1) Ownership boundaries

- Add browser/runtime UI dependencies only to `frontend/package.json`.
- Add API/runtime server dependencies only to `backend/package.json`.
- Add root-level dependencies only when they are truly workspace-wide tooling.

## 2) Review checklist for new dependencies

Before adding a package:

1. Confirm the capability does not already exist in the repo.
2. Prefer existing stack-aligned libraries over introducing alternatives.
3. Record the reason in the PR description (what problem it solves, why this package).
4. Keep dependency scope minimal (runtime vs dev-only).

## 3) Tooling consistency

- Keep lint/type/test tooling versions aligned where practical across workspaces.
- Avoid adding parallel toolchains unless there is a clear migration plan.
- Prefer one primary way to run each workflow (dev/build/test/lint/typecheck).

## 4) Cleanup expectations

- Remove dependencies that are no longer referenced by production code.
- Keep one lockfile strategy consistent with the active workflow.
- Periodically audit old one-off scripts and migration helpers.

## 5) CI / maintenance cadence

- Use routine dependency updates in small batches.
- Validate both workspaces when upgrading shared tooling.
- Treat dependency additions as architecture decisions, not just implementation details.
