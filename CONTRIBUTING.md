# Contributing

Thanks for helping improve Macro Tracker.

## Development setup

```bash
bun install
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
bun run dev
```

## Runtime profiles

- Managed profile: `APP_MODE=managed`, `AUTH_MODE=clerk`, `BILLING_MODE=managed`
- Self-hosted profile: `APP_MODE=self-hosted`, `AUTH_MODE=local`, `BILLING_MODE=disabled`

Please keep profile behavior consistent with the documented environment contracts in `README.md`, `backend/.env.example`, and `frontend/.env.example` when changing auth, billing, or config contracts.

## Before opening a PR

Run checks locally:

```bash
bun run --cwd backend typecheck
bun run --cwd backend lint
bun run --cwd backend test
bun run --cwd frontend typecheck
bun run --cwd frontend lint
bun run --cwd frontend test
```

## Pull request guidelines

- Keep changes focused and include tests for behavior changes.
- Update docs when public interfaces or environment contracts change.
- Do not commit secrets, production credentials, or generated database artifacts.
