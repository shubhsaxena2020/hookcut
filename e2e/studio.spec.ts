import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const VIDEO = process.env.TEST_VIDEO ?? path.resolve("e2e/fixtures/test-stream.mp4");
const OUT = path.resolve("e2e/out");

test("upload, find clips, edit a caption, switch layout, export a 1080x1920 MP4", async ({ page }) => {
  mkdirSync(OUT, { recursive: true });
  expect(existsSync(VIDEO), `test video missing: ${VIDEO}`).toBeTruthy();
  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Drop a long video/ })).toBeVisible();
  // fastest settings for CI hardware
  await page.selectOption("#model", "tiny");
  await page.getByRole("radio", { name: "30s" }).first().click();

  const t0 = Date.now();
  await page.getByTestId("file-input").setInputFiles(VIDEO);

  // 1-2. clips appear with scores (progressively, before transcription ends is fine)
  await expect(page.getByTestId("clip-card").first()).toBeVisible({ timeout: 20 * 60 * 1000 });
  const firstClipMs = Date.now() - t0;
  await expect(page.getByTestId("processing-done")).toBeVisible({ timeout: 20 * 60 * 1000 });
  const doneMs = Date.now() - t0;
  console.log(`first clip after ${firstClipMs} ms, transcription done after ${doneMs} ms`);
  const cards = await page.getByTestId("clip-card").count();
  expect(cards).toBeGreaterThan(0);
  const score = Number(await page.getByTestId("clip-score").first().innerText());
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThanOrEqual(100);
  // the language was left on auto-detect; the test stream is Hinglish (Hindi mixed with
  // English), which Whisper tiny and base both identify as Hindi
  const detectedLang = await page.getByTestId("detected-lang").first().innerText();
  expect(detectedLang).toMatch(/Detected language: (Hindi|English)/);
  await page.screenshot({ path: path.join(OUT, "clips-grid.png"), fullPage: true });

  // open the top clip
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await expect(page.getByTestId("editor")).toBeVisible();

  // 3. edit a caption word
  await page.getByRole("tab", { name: "Words" }).click();
  const chip = page.getByTestId("word-chip").nth(1);
  await chip.click();
  await page.getByTestId("word-input").fill("HOOKCUT");
  await page.getByTestId("word-input").press("Enter");
  await expect(page.getByTestId("word-chip").nth(1)).toHaveText("HOOKCUT");

  // 4. switch layout
  await page.getByRole("tab", { name: "Layout" }).click();
  await page.getByTestId("layout-fit-blur").click();
  await expect(page.getByTestId("layout-fit-blur")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("layout-auto").click();
  await expect(page.getByTestId("layout-auto")).toHaveAttribute("aria-checked", "true");
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "editor.png") });

  // expected duration from the timeline readout "In a, out b, 34.2s"
  const readout = await page.getByText(/In \d+:\d\d, out \d+:\d\d, [\d.]+s/).innerText();
  const expected = Number(readout.match(/([\d.]+)s$/)![1]);

  // SRT export
  await page.getByRole("tab", { name: "Clip" }).click();
  const [srt] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-srt").click()]);
  await srt.saveAs(path.join(OUT, "clip.srt"));
  const srtText = readFileSync(path.join(OUT, "clip.srt"), "utf8");
  const ends = [...srtText.matchAll(/--> (\d\d):(\d\d):(\d\d),(\d\d\d)/g)].map((m) => +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000);
  expect(ends.length).toBeGreaterThan(1);
  expect(Math.max(...ends)).toBeGreaterThan(expected * 0.5);
  expect(Math.max(...ends)).toBeLessThanOrEqual(expected + 1);

  // 5. opt in to the end card with a referral code, then export the MP4
  await page.locator("#t-endcard").click();
  await page.locator("#t-endref").click();
  const endcardUrl = await page.getByTestId("endcard-url").innerText();
  expect(endcardUrl).toMatch(/\?ref=[a-z0-9]{6}/);
  const t1 = Date.now();
  const downloadP = page.waitForEvent("download", { timeout: 20 * 60 * 1000 });
  await page.getByTestId("export-clip").click();
  // fail fast if the app reports an export error instead of downloading
  const dl = await Promise.race([
    downloadP,
    page
      .getByTestId("studio-error")
      .waitFor({ timeout: 20 * 60 * 1000 })
      .then(async () => {
        throw new Error(`Export error shown: ${await page.getByTestId("studio-error").innerText()}`);
      }),
  ]);
  const mp4 = path.join(OUT, "clip.mp4");
  await dl.saveAs(mp4);
  const exportMs = Date.now() - t1;
  console.log(`export took ${exportMs} ms`);

  // 6. verify with ffprobe
  const probe = JSON.parse(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration", "-of", "json", mp4]).toString(),
  );
  const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  const a = probe.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
  const dur = Number(probe.format.duration);
  expect(v.width).toBe(1080);
  expect(v.height).toBe(1920);
  expect(a, "audio track").toBeTruthy();
  // the clip plus the 1.5 s end card
  expect(Math.abs(dur - (expected + 1.5))).toBeLessThan(0.6);
  for (const [i, frac] of [0.15, 0.5, 0.85].entries()) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(expected * frac), "-i", mp4, "-frames:v", "1", path.join(OUT, `frame-${i}.png`)]);
  }
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(dur - 0.4), "-i", mp4, "-frames:v", "1", path.join(OUT, "frame-endcard.png")]);
  // export runs in a Web Worker on browsers that support it (Chrome does)
  const exportPath = logs.find((l) => l.includes("hookcut export: rendered"));
  expect(exportPath).toContain("Web Worker");
  writeFileSync(
    path.join(OUT, "result.json"),
    JSON.stringify(
      { firstClipMs, doneMs, cards, score, detectedLang, endcardUrl, expected, dur, video: v, audio: a, exportMs, exportPath, logs: logs.slice(-60) },
      null,
      2,
    ),
  );
});
