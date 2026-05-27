 PrepLion# Capacitor mobile wrap (PrepLion + StudentNest)
 PrepLion
 PrepLionBoth repos ship a native Android wrapper that loads the live deployed
 PrepLionsite inside a system WebView. iOS scaffolding is symmetrical but
 PrepLionrequires macOS to build.
 PrepLion
 PrepLion## What's in this repo
 PrepLion
 PrepLion| Path | Purpose |
 PrepLion|---|---|
 PrepLion| `capacitor.config.ts` | App ID + name + remote `server.url` |
 PrepLion| `mobile-www/index.html` | Bootstrap spinner before the WebView reaches the live site |
 PrepLion| `android/` | Full Gradle Android project (committed source) |
 PrepLion| `android/.gradle/`, `android/build/`, `android/app/build/` | Build artifacts — gitignored |
 PrepLion
 PrepLion## Why Remote URL mode
 PrepLion
 PrepLionNext.js SSR can't be statically exported in its entirety (server routes,
 PrepLionAPI handlers, middleware). Remote URL mode keeps the native shell thin —
 PrepLionthe WebView just loads `https://studentnest.ai` (or staging via
 PrepLion`CAP_SERVER_URL`) and all features (auth, push, SMS opt-in, etc.) work
 PrepLionunchanged because they're the same routes the browser hits.
 PrepLion
 PrepLionTrade-off: no offline mode at the native layer. Mitigated because the
 PrepLionPWA service worker (`public/sw.js`) already caches the shell + recently
 PrepLionviewed routes.
 PrepLion
 PrepLion## Build prerequisites (Windows)
 PrepLion
 PrepLion1. **JDK 17** — Adoptium Temurin recommended.
 PrepLion2. **Android Studio** (Hedgehog or later). Lets the SDK manager install
 PrepLion   the right build-tools + platform.
 PrepLion3. **Android SDK Platform 34** + **build-tools 34.0.0**.
 PrepLion4. Set `ANDROID_HOME` env var (defaults to `%LOCALAPPDATA%\Android\Sdk`).
 PrepLion
 PrepLioniOS adds: macOS + Xcode 15 + an Apple Developer account.
 PrepLion
 PrepLion## Build commands
 PrepLion
 PrepLion```bash
 PrepLion# Sync latest web assets + capacitor.config into android/
 PrepLionnpx cap sync android
 PrepLion
 PrepLion# Open Android Studio
 PrepLionnpx cap open android
 PrepLion
 PrepLion# CLI debug APK (no signing)
 PrepLioncd android
 PrepLion.\gradlew assembleDebug
 PrepLion# → android/app/build/outputs/apk/debug/app-debug.apk
 PrepLion
 PrepLion# Signed release AAB (for Play Store)
 PrepLion.\gradlew bundleRelease
 PrepLion# Requires android/keystore.properties + a release keystore (see below)
 PrepLion```
 PrepLion
 PrepLion## Signing for Play Store
 PrepLion
 PrepLion1. Generate a release keystore (one-time, NEVER commit):
 PrepLion   ```bash
 PrepLion   keytool -genkey -v -keystore android/app/upload-keystore.jks \
 PrepLion     -keyalg RSA -keysize 2048 -validity 10000 -alias upload
 PrepLion   ```
 PrepLion2. Create `android/keystore.properties`:
 PrepLion   ```
 PrepLion   storePassword=...
 PrepLion   keyPassword=...
 PrepLion   keyAlias=upload
 PrepLion   storeFile=upload-keystore.jks
 PrepLion   ```
 PrepLion3. Both files are gitignored.
 PrepLion
 PrepLion## Pointing at staging
 PrepLion
 PrepLion```bash
 PrepLionCAP_SERVER_URL=https://studentnest-staging.pages.dev npx cap sync android
 PrepLion```
 PrepLion
 PrepLion## App identifiers
 PrepLion
 PrepLion| Repo | App ID | Display |
 PrepLion|---|---|---|
 PrepLion| PrepLion | `ai.studentnest.app` | PrepLion |
 PrepLion| StudentNest | `ai.studentnest.app` | StudentNest |
 PrepLion
 PrepLionKeep these stable — Play Store treats the app ID as the primary key
 PrepLionforever.
 PrepLion
 PrepLion## Push + SMS in the WebView
 PrepLion
 PrepLion- **Web Push** works inside the Android WebView via the FCM-backed
 PrepLion  service worker. No native plugin required because we use the standard
 PrepLion  `pushManager.subscribe` flow.
 PrepLion- **SMS opt-in** works identically — `/api/sms/opt-in` is a plain web
 PrepLion  fetch.
 PrepLion- For richer native push (icons, deep links bypassing the WebView),
 PrepLion  install `@capacitor/push-notifications` later.
 PrepLion
 PrepLion## iOS (later)
 PrepLion
 PrepLion```bash
 PrepLionnpm install @capacitor/ios --legacy-peer-deps
 PrepLionnpx cap add ios
 PrepLionnpx cap open ios   # opens Xcode (Mac only)
 PrepLion```
 PrepLion
 PrepLion## Updating after web deploy
 PrepLion
 PrepLionBecause `server.url` points at production, simply deploying the website
 PrepLionauto-updates the mobile app — no Play Store resubmission needed unless
 PrepLionthe native shell itself (icons, permissions, Capacitor version) changes.
