# Android release build

## Config guard

`assembleRelease` and `bundleRelease` depend on `verifyReleaseCapacitorConfig`,
which reads `android/app/src/main/assets/capacitor.config.json` and fails the
build if it was synced from a dev profile (`server.hostname` other than
`app.macrotrackr.com`, or `server.cleartext` set).

Always build from a prod sync:

```bash
cd frontend && bun run cap:sync:prod
```

The guard only covers the webview origin. It cannot tell you whether the JS
bundle points at the right API, so check `VITE_API_URL` too.

## Enabling R8 (not yet on)

`minifyEnabled` and `shrinkResources` are both `false`. The keep rules in
`android/app/proguard-rules.pro` are already written, so enabling it is a
two-line change in `android/app/build.gradle`.

It is off because it cannot be verified from a build alone. Capacitor resolves
plugins and their methods reflectively, so when R8 strips one the build still
succeeds and the failure only appears at runtime as a feature that quietly does
nothing. Before shipping a minified build, install it on a device and confirm:

- Google sign-in completes (`GoogleAuth`, reflectively registered)
- The Pro purchase sheet opens and a purchase reconciles (`PlayBillingPlugin`)
- The barcode scanner opens the camera
- Deep links into `/sso-callback` still resolve
- Real-time sync reconnects after backgrounding the app

If a plugin misbehaves, add a `-keep` for its class rather than turning R8 off
again, and note it in `proguard-rules.pro` with the symptom you saw.

## App Links

Deep-link verification is separate and currently incomplete — see
[app-links-verification.md](./app-links-verification.md).
