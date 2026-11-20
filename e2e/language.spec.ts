import { test, expect } from "@playwright/test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Auto-detect on speech in a known language. We use a public-domain LibriVox
 * reading of Tirano Banderas for Spanish (TEST_VIDEO_ES) and Windows text-to-speech
 * for English (TEST_VIDEO_EN), each over a plain background.
 */
const OUT = path.resolve("e2e/out");
const CASES = [
  { env: "TEST_VIDEO_EN", language: "English" },
  { env: "TEST_VIDEO_ES", language: "Spanish" },
];

for (const c of CASES) {
  test(`auto-detect recognises ${c.language} speech`, async ({ page }) => {
    const video = process.env[c.env] ?? "";
    test.skip(!video || !existsSync(video), `set ${c.env} to a ${c.language} speech video`);
    mkdirSync(OUT, { recursive: true });
    await page.goto("/app");
    await page.selectOption("#model", "tiny");
    await expect(page.locator("#lang")).toHaveValue("auto");
    const t0 = Date.now();
    await page.getByTestId("file-input").setInputFiles(video);
    const lang = page.getByTestId("detected-lang").first();
    await expect(lang).toBeVisible({ timeout: 20 * 60 * 1000 });
    const text = await lang.innerText();
    const detectMs = Date.now() - t0;
    // the first clip card shows transcribed words, as evidence of the transcription language
    await expect(page.getByTestId("clip-card").first()).toBeVisible({ timeout: 20 * 60 * 1000 });
    const card = await page.getByTestId("clip-card").first().innerText();
    writeFileSync(
      path.join(OUT, `language-${c.language.toLowerCase()}.json`),
      JSON.stringify({ text, detectMs, firstClipCard: card.slice(0, 300) }, null, 2),
    );
    expect(text).toContain(c.language);
  });
}
