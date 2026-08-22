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

## The one thing left to fill in

The file currently ships a placeholder fingerprint, so verification will still
fail. Replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` with the real value:

Play Console → Setup → App signing → **SHA-256 certificate fingerprint**.

With Play App Signing that is the certificate *Google* re-signs with, not your
local upload key — using the upload key's fingerprint is the usual reason this
silently keeps failing. If you also ship a locally-signed release build, add its
fingerprint as a second entry in the same array.

## Checking it

```bash
cd frontend && bun run verify:assetlinks
```

That validates the deployed file: correct relation and namespace, package name
matches `com.macrotrackr.app`, and every fingerprint is a real uppercase
colon-separated SHA-256. It exits non-zero while the placeholder is in place.
Once the real fingerprint is committed, add it to the `lint` script so a bad
edit can't reach production.

After deploying, confirm on a device:

```bash
adb shell pm get-app-links com.macrotrackr.app
```

The domain should read `verified`.
