import { defineConfig } from "@playwright/test";

/**
 * E2E runs in real Google Chrome (channel "chrome") because Chromium builds
 * shipped with Playwright lack the proprietary H.264 codecs WebCodecs needs.
 * BASE_URL defaults to a local `next start`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30 * 60 * 1000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [["list"]],
  outputDir: "e2e/out/test-results",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3100",
    channel: "chrome",
    headless: true,
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ["--enable-unsafe-webgpu", "--autoplay-policy=no-user-gesture-required"] },
  },
});
