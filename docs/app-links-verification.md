# App Links verification (assetlinks.json)

The Android manifest declares an `autoVerify` https deep link for
`https://macrotrackr.com/sso-callback`. Android only opens that link in the app
once the domain proves it owns the package, and it does so by fetching
`https://macrotrackr.com/.well-known/assetlinks.json`.

## Where the file lives

`frontend/public/.well-known/assetlinks.json`.

`frontend/public/` is the production docroot — everything in it is served at the
root of macrotrackr.com by Cloudflare, with the correct content type and no
redirects. Nothing needs to change in the infra repo.

## The fingerprint

The file lists the **Play App Signing** certificate (Play Console → Test and
release → App integrity → App signing key, SHA-256). Google re-signs every
build from the App Bundle with that key, so it is the one Android checks; the
local upload key's fingerprint would silently fail verification. If you ever
ship a locally signed release build, add its fingerprint as a second entry in
the same array.

## Checking it

```bash
cd frontend && bun run verify:assetlinks
```

That validates the file: correct relation and namespace, package name matches
`com.macrotrackr.app`, and every fingerprint is a real uppercase
colon-separated SHA-256. It runs as part of `bun run lint`, so a bad edit
fails CI.

After deploying, confirm on a device:

```bash
adb shell pm get-app-links com.macrotrackr.app
```

The domain should read `verified`.
