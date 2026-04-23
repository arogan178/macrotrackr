# Security Policy

## Supported profiles

- Public self-hosted profile: local auth + billing disabled
- Managed hosting is operated separately and is not part of the public deployment surface

## Reporting vulnerabilities

Do not open public issues for sensitive vulnerabilities.

Email: `support@local.invalid`

Include:

- affected component and public runtime profile
- reproduction steps
- impact assessment
- suggested mitigation (if available)

We will acknowledge reports as quickly as possible and coordinate disclosure
after a fix is available.

## Security expectations

- Never commit real secrets or production credentials.
- Use environment-specific `.env` files outside source control.
- Keep dependencies updated and run CI quality gates before release.
