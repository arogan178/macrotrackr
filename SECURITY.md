# Security Policy

## Supported profiles

- `managed`: Clerk auth + managed billing
- `self-hosted`: local auth + billing disabled

## Reporting vulnerabilities

Do not open public issues for sensitive vulnerabilities.

Email: `support@local.invalid`

Include:

- affected component and profile (`managed` or `self-hosted`)
- reproduction steps
- impact assessment
- suggested mitigation (if available)

We will acknowledge reports as quickly as possible and coordinate disclosure
after a fix is available.

## Security expectations

- Never commit real secrets or production credentials.
- Use environment-specific `.env` files outside source control.
- Keep dependencies updated and run CI quality gates before release.
