import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — Remote URL mode.
 *
 * The native WebView loads the live deployed site directly. mobile-www
 * holds a bootstrap spinner only used while the network is unreachable.
 *
 * Override server.url with CAP_SERVER_URL env var for staging.
 */

const SERVER_URL = process.env.CAP_SERVER_URL ?? "https://studentnest.ai";

const config: CapacitorConfig = {
  appId: "ai.studentnest.app",
  appName: "StudentNest",
  webDir: "mobile-www",
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
