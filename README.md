# Methodology

A programming and tracking app built around one specific coaching approach:
the coach programs an **ordered sequence of block slots**, chooses the exercise
that fills each slot at delivery time, autoregulates load **set by set**, and
measures progress through a **repeated evaluation battery** rather than load on
the bar.

Most training apps invert this — they lock the exercise and treat weight lifted
as the outcome. That fits a powerlifter. It does not fit a general or clinical
population, where the point is function and health markers.

## What the model encodes

| Concept | Why it exists |
| --- | --- |
| `Block` | The slot — Lower, Upper Pull, Carry, Anti-Extension, Zone 2. Programmed ahead; the exercise inside it rotates freely. |
| `SessionItem` | One slot in one session, holding the prescription and what the coach actually wrote. |
| `PerformedSet` | Per-set load and reps. Loads commonly ramp within a slot (`77, 88, 88`) — that ramp *is* the autoregulation. |
| `groupLabel` | Superset and circuit pairings (`1A`, `1B`), which the tracker recorded in the block column. |
| `Assessment` / `AssessmentMetric` | The re-evaluation battery: girths, blood pressure, grip, plank, sit-and-reach, back extension, single-leg stand, strength tests, cardio recovery. Metrics are rows, so the battery can change without a migration. |
| Session vitals | Pre/post blood pressure, bodyweight, session RPE. This population trains with real clinical constraints, so monitoring sits next to training rather than in a separate system. |

Blood pressure is categorised against the 2017 ACC/AHA thresholds to flag
readings for review. It is a prompt to look, not a diagnosis.

## Deploying

See **[DEPLOY.md](DEPLOY.md)** for click-by-click instructions that need no
command line: connect the repository to Vercel, attach a Postgres database, set
one secret, and deploy. Migrations and the block/assessment seed run
automatically on every deploy, so a fresh database comes up ready to use.

The first visitor to a new deployment is sent to `/setup` to create the coach
account. That page closes permanently once any account exists.

## Local development

```bash
npm install
cp .env.example .env        # point DATABASE_URL at your Postgres, set SESSION_SECRET
npx prisma migrate deploy
npm run db:seed             # block taxonomy + assessment battery
npm run dev
```

Then open http://localhost:3000 and create your account through `/setup`, or
skip the browser with `npm run user:create -- you@example.com "Your Name"`,
which prints a generated password unless you pass one as a third argument.

### Importing a tracker workbook

Upload it at **Import Tracker** in the sidebar, or from a terminal:

```bash
npm run import:xlsx -- path/to/tracker.xlsx --reset
```

`--reset` clears existing clients first, which is what re-importing an updated
copy of the same workbook means. Coach accounts are never touched.

The importer reads the spreadsheet format these programmes were kept in, where
the same information is recorded inconsistently as habits changed over time:

- Performed loads live in a dedicated column early on, and in the prescription
  column later once the coach stopped separating the two.
- The block column is abandoned entirely once the sequence became habitual.
  Missing slots are recovered from how the same exercise is labelled elsewhere,
  then by name (`src/lib/classify.ts`).
- Excel silently turned comma-separated load lists into single integers
  (`110,125,125` → `110125125`). These are split back apart when the digits
  divide cleanly into plausible loads.
- Day type is inferred from a session's loaded slots, because the header
  wording stopped tracking it. The header is read only for what it reliably
  names — its own columns.

Every parsed value keeps the coach's original wording beside it. The shorthand
carries context ("on blue foam", "assisted", "switched to DB step-up on the
second set") that the number alone loses.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Parser tests |
| `npm run db:seed` | Seed blocks and assessment metrics |
| `npm run db:studio` | Browse the database |
| `npm run import:xlsx -- <file>` | Import a tracker workbook |
| `npm run user:create -- <email> <name>` | Create or reset a coach account |
| `node scripts/smoke.mjs <clientId> <email> <password>` | End-to-end check of the main flows |
| `node scripts/auth-check.mjs <clientId> <email> <password>` | Verify the app is closed when signed out |
| `scripts/verify-first-run.sh <file.xlsx>` | Rebuild an empty database and walk the whole first-run journey (destroys local data) |

## Stack

Next.js 16 (App Router), TypeScript, Tailwind 4, Prisma 6 with Postgres,
Recharts. Status-like fields are strings constrained by union types in
`src/lib/constants.ts` rather than database enums, so adding a block category
or session status is a code change rather than a migration.

## Access

Every page is behind a sign-in. `src/proxy.ts` denies by default and routes opt
out explicitly, because the app stores blood pressure readings and medical
notes. Server actions check the session themselves as well, since they are
separately reachable endpoints and the proxy only gates navigation.

Sessions are signed, self-contained cookies (HMAC-SHA256, 30 days) so they can
be verified in the edge runtime where Prisma is unavailable. Passwords are
bcrypt hashed. `SESSION_SECRET` must be set to a random value — rotating it
signs everyone out.

## Not yet built

- A client-facing view. Clients cannot yet see their own programme or log their
  own sessions. The `User`/`Client` link exists in the schema for this.
- Saving a session's slot sequence as a reusable template from the UI.
- Password reset by email, and a way to add a second coach account from the UI.
  Both currently need `npm run user:create`.
