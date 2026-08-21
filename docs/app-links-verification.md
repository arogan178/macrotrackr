# App Links verification (assetlinks.json)

The Android manifest declares an `autoVerify` https deep link for
`https://macrotrackr.com/sso-callback`. Until the domain proves ownership,
Android will not open those links directly in the app.

To verify, serve this file at `https://macrotrackr.com/.well-known/assetlinks.json`
(Content-Type `application/json`, no redirects):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.macrotrackr.app",
      "sha256_cert_fingerprints": [
        "REPLACE_WITH_RELEASE_CERT_SHA256"
      ]
    }
  }
]
```

Get the fingerprint from the Play Console (Setup → App signing → SHA-256
certificate fingerprint) — with Play App Signing that is the key Google signs
with, not your local upload key. Include one entry per signing cert if you
also ship a local-release build.

Verify afterwards: `adb shell pm get-app-links com.macrotrackr.app` should
show the domain as verified.
