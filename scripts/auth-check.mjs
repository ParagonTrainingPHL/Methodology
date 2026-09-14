// Verifies that the app is closed by default and opens only after signing in.
// Usage: node scripts/auth-check.mjs <clientId> <email> <password>
import { chromium } from "playwright";

const [, , clientId, email, password] = process.argv;
const base = "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
});

function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) process.exitCode = 1;
}

// Signed out: every protected route should bounce to the login page.
const anon = await browser.newContext();
const anonPage = await anon.newPage();

for (const route of ["/", "/library", `/clients/${clientId}`, `/clients/${clientId}/progress`]) {
  await anonPage.goto(`${base}${route}`, { waitUntil: "networkidle" });
  check(`signed out: ${route} redirects to login`, /\/login/.test(anonPage.url()));
}

// The redirect should remember where the coach was headed.
await anonPage.goto(`${base}/clients/${clientId}/progress`, {
  waitUntil: "networkidle",
});
check(
  "redirect preserves the requested page",
  anonPage.url().includes("next=%2Fclients"),
);

// Client health data must not be in the signed-out response body.
const body = await anonPage.content();
check("no client data leaks to a signed-out visitor", !body.includes("Schmitt"));

// Wrong password must be rejected.
await anonPage.goto(`${base}/login`, { waitUntil: "networkidle" });
await anonPage.fill('input[name="email"]', email);
await anonPage.fill('input[name="password"]', "not-the-password");
await anonPage.click('button[type="submit"]');
await anonPage.waitForTimeout(1800);
check(
  "wrong password is rejected",
  anonPage.url().includes("/login") &&
    (await anonPage.locator("text=incorrect").count()) > 0,
);

// Correct password signs in and lands on the requested page.
const user = await browser.newContext();
const page = await user.newPage();
await page.goto(`${base}/login?next=%2Flibrary`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL("**/library", { timeout: 20000 });
check("correct password signs in", page.url().endsWith("/library"));

await page.goto(`${base}/clients/${clientId}`, { waitUntil: "networkidle" });
check(
  "signed in: client page is reachable",
  (await page.locator("text=Schmitt").count()) > 0,
);

// Signing out must close access again.
await page.click('button:has-text("Sign out")');
await page.waitForURL("**/login", { timeout: 20000 });
await page.goto(`${base}/clients/${clientId}`, { waitUntil: "networkidle" });
check("sign out closes access again", /\/login/.test(page.url()));

await browser.close();
