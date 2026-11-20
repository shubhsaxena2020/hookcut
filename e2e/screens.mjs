// Screenshots of every page at 1440 and 390 px wide.
// Usage: node e2e/screens.mjs https://hookcut-app.vercel.app e2e/out/screens
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "e2e/out/screens";
mkdirSync(out, { recursive: true });
const pages = [
  ["home", "/"],
  ["studio", "/app"],
  ["pricing", "/pricing"],
  ["blog", "/blog"],
  ["blog-post-stream", "/blog/find-best-moments-in-a-long-stream"],
  ["blog-post-captions", "/blog/captions-that-stay-in-sync"],
  ["changelog", "/changelog"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
];
const browser = await chromium.launch({ channel: "chrome" });
for (const [w, h, tag] of [[1440, 900, "1440"], [390, 844, "390"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const [name, p] of pages) {
    await page.goto(base + p, { waitUntil: "load", timeout: 90_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${name}-${tag}.png`), fullPage: true });
    console.log("shot", name, tag);
  }
  await ctx.close();
}
await browser.close();
