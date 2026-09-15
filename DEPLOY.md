# Putting Methodology on the web

This gets the app onto a real web address you can open from your phone at the
gym or any computer. **No command line at any point.** Everything below happens
in a web browser.

Budget about 20 minutes the first time. After this, any change is redeployed
automatically.

You will need a free [Vercel](https://vercel.com) account. Vercel is the
company that makes Next.js, which this app is built with, and their free tier
is enough for a coaching practice of this size.

---

## Step 1 — Merge the branch on GitHub

The app currently lives on a branch. Put it on `main` so Vercel picks it up.

1. Go to https://github.com/ParagonTrainingPHL/Methodology
2. You'll see a yellow banner about the `claude/workout-programming-app-hrjn50`
   branch. Click **Compare & pull request**.
   - No banner? Click **Pull requests** → **New pull request**, set "compare"
     to `claude/workout-programming-app-hrjn50`, click **Create pull request**.
3. Click **Create pull request**, then **Merge pull request**, then
   **Confirm merge**.

---

## Step 2 — Create the Vercel project

1. Go to https://vercel.com/signup and choose **Continue with GitHub**.
2. Once signed in, click **Add New…** → **Project**.
3. Find **Methodology** in the repository list and click **Import**.
   - If it isn't listed, click **Adjust GitHub App Permissions** and grant
     Vercel access to the repository.
4. **Do not click Deploy yet.** The app needs a database first. Leave this tab
   open and go to Step 3.

---

## Step 3 — Add the database

The app stores your clients in a Postgres database. Vercel can create one for
you.

1. In the same project screen, find the **Storage** tab (or go to the
   **Storage** tab in your Vercel dashboard).
2. Click **Create Database** → choose **Postgres** (listed as Neon) →
   **Continue**.
3. Give it any name, pick the region closest to you, and click **Create**.
4. Make sure it is **connected to your Methodology project**. Vercel usually
   does this automatically; if asked, choose the Methodology project and click
   **Connect**.

This automatically creates the `DATABASE_URL` setting the app needs. You do not
need to copy anything.

---

## Step 4 — Add your secret key

This is the one value you set by hand. It's what keeps other people from
forging a login.

1. In your project, go to **Settings** → **Environment Variables**.
2. Add a new variable:
   - **Name:** `SESSION_SECRET`
   - **Value:** a long random string — mash the keyboard for 40+ characters, or
     use https://generate-secret.vercel.app/32 to generate one
   - **Environments:** tick all of them (Production, Preview, Development)
3. Click **Save**.

Keep this value private, and don't change it later — changing it signs everyone
out.

---

## Step 5 — Deploy

1. Go to the **Deployments** tab and click **Deploy** (or **Redeploy** on the
   most recent entry).
2. Wait 2–3 minutes. You'll see build output scroll past; that's normal.
3. When it finishes you'll get a web address like
   `methodology-xxxx.vercel.app`. **That's your app.** Bookmark it.

The database tables are created automatically during this deploy. There is
nothing else to run.

---

## Step 6 — Create your account

1. Open your new web address.
2. It will show **Welcome to Methodology** and ask you to create an account.
   Enter your name, email, and a password of at least 10 characters.
3. Click **Create account**. You're signed in.

This welcome screen appears **only once**. As soon as your account exists it
closes permanently, so nobody else can claim the app.

---

## Step 7 — Upload your tracker

1. Click **Import Tracker** in the left sidebar.
2. Click **Choose File** and select your
   `Training and Progress Tracker.xlsx`.
3. Click **Import** and wait — a full workbook takes a minute or so.
4. You'll see a summary of what came in. Click **View clients**.

Done. Your programmes and evaluations are in the app.

---

## Afterwards

**Using it on your phone.** Open the web address in your phone's browser. On
iPhone, tap Share → *Add to Home Screen* and it behaves like an app icon.

**Updating your data.** Re-upload the workbook any time from **Import Tracker**.
Leave *Replace existing clients* ticked so it refreshes rather than duplicating.
Once you're working in the app directly, you won't need the spreadsheet.

**Adding a client.** Click **New client** on the Clients page — no spreadsheet
involved.

**Forgotten password.** There's no email reset yet. Ask me and I'll add one, or
I can reset it for you directly.

---

## If something goes wrong

**The deploy failed.** Open the failed deployment and read the last few red
lines. The usual cause is the database not being connected — recheck Step 3,
then redeploy.

**"Something went wrong" when you open the app.** `SESSION_SECRET` is probably
missing or only set for some environments. Recheck Step 4, ticking every
environment, then redeploy.

**The welcome screen never appears and it asks you to sign in instead.** An
account already exists on that database. Sign in with it, or ask me to clear it.

**The upload fails.** The file must be `.xlsx` — if yours is `.xls` or a Google
Sheet, open it and use *File → Download → Microsoft Excel (.xlsx)*.

---

## A note on privacy

This app holds client health information — blood pressure readings, medical
notes, body measurements. Some practical consequences:

- Everything is behind your login. There are no public pages.
- The web address is not secret, but without your password it shows nothing.
- Use a password you don't use anywhere else, and don't share the account —
  ask me to add separate logins if someone else needs access.
- Depending on where you practise, this data may carry legal obligations
  (HIPAA in the US, for example). Worth a conversation with whoever advises
  your business before you put real client records in a hosted system.
