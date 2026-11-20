import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
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
  const cards = await page.getByTestId("clip-card").count();
  expect(cards).toBeGreaterThan(0);
  const score = Number(await page.getByTestId("clip-score").first().innerText());
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThanOrEqual(100);
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

  // 5. export the MP4
  const t1 = Date.now();
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 20 * 60 * 1000 }),
    page.getByTestId("export-clip").click(),
  ]);
  const mp4 = path.join(OUT, "clip.mp4");
  await dl.saveAs(mp4);
  const exportMs = Date.now() - t1;

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
  expect(Math.abs(dur - expected)).toBeLessThan(0.6);
  for (const [i, frac] of [0.15, 0.5, 0.85].entries()) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(dur * frac), "-i", mp4, "-frames:v", "1", path.join(OUT, `frame-${i}.png`)]);
  }
  writeFileSync(
    path.join(OUT, "result.json"),
    JSON.stringify({ firstClipMs, doneMs, cards, score, expected, dur, video: v, audio: a, exportMs, logs: logs.slice(-60) }, null, 2),
  );
});
