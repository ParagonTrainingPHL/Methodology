// Dev helper: screenshot a route and report any console/page errors.
// Usage: node scripts/shot.mjs /clients out.png [height]
import { chromium } from "playwright";

const [, , route = "/", out = "shot.png", height = "1400"] = process.argv;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: Number.parseInt(height, 10) },
  deviceScaleFactor: 2,
});

const problems = [];
page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
});
page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));

const response = await page.goto(`http://localhost:3000${route}`, {
  waitUntil: "networkidle",
  timeout: 45000,
});

await page.waitForTimeout(700);
await page.screenshot({ path: out, fullPage: true });

console.log(`status ${response?.status()}`);
if (problems.length) {
  console.log("--- problems:");
  for (const problem of [...new Set(problems)]) console.log("  " + problem);
} else {
  console.log("no console errors");
}

await browser.close();
