// Walks the journey a brand-new deployment goes through, with no terminal:
// land on the app, create the first account, upload a tracker, see the data.
//
// Usage: node scripts/first-run-check.mjs <path-to-tracker.xlsx>
import { chromium } from "playwright";

const trackerPath = process.argv[2];
if (!trackerPath) throw new Error("usage: node scripts/first-run-check.mjs <xlsx>");

const base = "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) process.exitCode = 1;
}

// A fresh deployment should route the very first visitor to setup, not login.
await page.goto(base, { waitUntil: "networkidle" });
check("empty install sends the first visitor to setup", page.url().endsWith("/setup"));

// Setup should reject a mismatched confirmation rather than create the account.
await page.fill('input[name="name"]', "Coach");
await page.fill('input[name="email"]', "coach@example.com");
await page.fill('input[name="password"]', "correct-horse-battery");
await page.fill('input[name="confirm"]', "something-else");
await page.click('button:has-text("Create account")');
await page.waitForTimeout(1500);
check(
  "mismatched passwords are rejected",
  (await page.locator("text=do not match").count()) > 0,
);

// A rejected submit must not wipe what was already typed.
check(
  "a failed submit keeps the name and email",
  (await page.inputValue('input[name="name"]')) === "Coach" &&
    (await page.inputValue('input[name="email"]')) === "coach@example.com",
);

// A short password should be rejected too.
await page.fill('input[name="password"]', "short");
await page.fill('input[name="confirm"]', "short");
await page.click('button:has-text("Create account")');
await page.waitForTimeout(1500);
check(
  "short passwords are rejected",
  (await page.locator("text=at least 10 characters").count()) > 0,
);

// Valid details create the account and sign the coach straight in.
await page.fill('input[name="password"]', "correct-horse-battery");
await page.fill('input[name="confirm"]', "correct-horse-battery");
await page.click('button:has-text("Create account")');
await page.waitForURL((url) => url.pathname === "/", { timeout: 25000 });
check("setup creates the account and signs in", page.url().endsWith("/"));

// With an account in place, setup must close permanently.
await page.goto(`${base}/setup`, { waitUntil: "networkidle" });
check("setup closes once an account exists", page.url().includes("/login"));

// Upload the tracker through the browser.
await page.goto(`${base}/import`, { waitUntil: "networkidle" });
await page.setInputFiles('input[type="file"]', trackerPath);
await page.click('button:has-text("Import")');
await page.waitForSelector("text=Import complete", { timeout: 180000 });
check("tracker uploads and imports", true);

const figures = await page
  .locator(".tabular")
  .allTextContents();
check(
  "import reports the expected client count",
  figures.some((t) => t.trim() === "11"),
);

// The imported data should now be visible in the app. Navigation here is a
// client-side transition, so wait for the destination rather than a page load.
await page.click('a:has-text("View clients")');
await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 });
// Scoped to the table: the page header also links to /clients/new.
const roster = page.locator('table a[href^="/clients/"]').first();
await roster.waitFor({ state: "visible", timeout: 20000 });
check(
  "imported clients appear in the roster",
  (await page.locator("text=Karl Schmitt").count()) > 0,
);

await roster.click();
await page.waitForURL(
  (url) => /^\/clients\/[a-z0-9]+$/.test(url.pathname) && !url.pathname.endsWith("/new"),
  { timeout: 20000 },
);
await page.waitForSelector("text=Session history", { timeout: 20000 });
check("a client's sessions are reachable", true);

await page.goto(`${base}/clients/${(await page.url().split("/clients/")[1])}/progress`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);
check(
  "progress charts render for imported data",
  (await page.locator("svg.recharts-surface").count()) > 0,
);

console.log(
  errors.length
    ? `\nconsole/page errors:\n  ${[...new Set(errors)].join("\n  ")}`
    : "\nno console errors",
);
if (errors.length) process.exitCode = 1;

await browser.close();
