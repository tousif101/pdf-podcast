import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:3001";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "320-small-phone", width: 320, height: 650 },
  { name: "390-phone", width: 390, height: 844 },
  { name: "768-tablet", width: 768, height: 1024 },
  { name: "1280-laptop", width: 1280, height: 800 },
  { name: "1920-desktop", width: 1920, height: 1080 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${vp.name}-list.png` });

  // Open the player on the first ready episode, if any.
  const playBtn = page
    .locator("button", { hasText: /play/i })
    .or(page.locator('[aria-label*="Play" i]'))
    .first();
  if ((await playBtn.count()) > 0) {
    await playBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${vp.name}-player.png` });
  }

  // Expand transcript if a toggle exists.
  const transcriptBtn = page
    .locator("button", { hasText: /transcript/i })
    .first();
  if ((await transcriptBtn.count()) > 0) {
    await transcriptBtn.click().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/${vp.name}-transcript.png`,
      fullPage: true,
    });
  }
  await page.close();
}
await browser.close();
console.log("done");
