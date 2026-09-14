// End-to-end check of the paths a coach actually clicks through.
// Usage: node scripts/smoke.mjs <clientId>
import { chromium } from "playwright";

const [, , clientId, email = "paragontrainingphl@gmail.com", password] = process.argv;
if (!clientId || !password) {
  throw new Error("usage: node scripts/smoke.mjs <clientId> <email> <password>");
}

const base = "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
  timeout: 20000,
});

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) process.exitCode = 1;
}

// 1. Create a session by repeating a previous one.
await page.goto(`${base}/clients/${clientId}/sessions/new`, {
  waitUntil: "networkidle",
});
const repeatOption = page.locator("text=/^Repeat /").first();
await repeatOption.click();
await page.locator("text=Slots only").click();
await page.locator('button:has-text("Create session")').click();
await page.waitForURL(/\/sessions\/(?!new)[a-z0-9]+/, { timeout: 20000 });
await page.waitForLoadState("networkidle");

const sessionUrl = page.url();
check("created a session from a previous one", /\/sessions\//.test(sessionUrl));

const slotCount = await page.locator("li:has(button)").count();
check("copied session has slots", slotCount > 0);

// Slots-only copy must not carry the exercises over.
const choiceEmpty = await page.locator("text=choose exercise").count();
check("slots-only copy left exercises blank", choiceEmpty > 0);

// 2. Log sets using the coach's shorthand.
await page.goto(sessionUrl, { waitUntil: "networkidle" });
const logButton = page.locator('button:has-text("log sets")').first();
await logButton.click();
const input = page.locator('input[placeholder="77,88,88"]');
await input.fill("95,105,110");
await page.locator('button:has-text("Save")').first().click();
await page.waitForTimeout(2500);

const logged = await page.locator("text=95 / 105 / 110").count();
check("shorthand logged as three separate sets", logged > 0);

const completed = await page.locator("text=Completed").count();
check("logging marked the session completed", completed > 0);

// 3. Record vitals, including a blood-pressure reading written as one field.
await page.locator('button:has-text("Add blood pressure")').click();
await page.locator('input[placeholder="147/88"]').fill("152/94");
await page.locator('textarea').fill("Smoke test note");
await page.locator('button:has-text("Save")').first().click();
await page.waitForTimeout(2500);

const bpShown = await page.locator("text=152/94").count();
check("blood pressure parsed from a single field", bpShown > 0);
const stage = await page.locator("text=Stage 2").count();
check("blood pressure flagged by clinical stage", stage > 0);

// 4. Add a new slot and confirm the block is suggested from the exercise name.
await page.locator('button:has-text("Add slot")').click();
await page.locator('input[placeholder="Search, or type a new one"]').fill(
  "Bulgarian split squat",
);
await page.locator('button:has-text("Add slot")').last().click();
await page.waitForTimeout(2500);
const added = page.locator("li", { hasText: "Bulgarian split squat" }).first();
check("added a brand-new exercise as a slot", (await added.count()) > 0);
const suggestedBlock = await added.locator("span", { hasText: "Lower" }).count();
check("block suggested from the new exercise's name", suggestedBlock > 0);

await page.goto(`${base}/clients/${clientId}/progress`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);
const charts = await page.locator("svg.recharts-surface").count();
check("progress charts render", charts > 0);

console.log(
  errors.length ? `\nconsole/page errors:\n  ${[...new Set(errors)].join("\n  ")}` : "\nno console errors",
);
if (errors.length) process.exitCode = 1;

console.log(`\nsession under test: ${sessionUrl}`);
await browser.close();
