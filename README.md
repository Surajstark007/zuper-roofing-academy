# Zuper Roofing Academy — self-hosted

A static website (no build step) that uses **Supabase** for sign-in and for storing each learner's progress, with a team dashboard for leads and HR.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The whole Academy: lessons, quizzes, case studies, reference, My progress and the Team dashboard. |
| `config.js` | **The only file you need to edit**: Supabase URL and key, allowed email domain, sign-in methods, deck link, logo. |
| `auth.js` | Sign-in screen and the connection between the app and Supabase. |
| `supabase/schema.sql` | Tables, access rules and live updates. Run once in Supabase. |
| `vendor/` | The Supabase JavaScript client (v2.45.4, MIT licence), bundled so the site loads no third-party scripts. |
| `assets/` | Put your logo here. |
| `vercel.json` | Optional security headers for Vercel. |

## Setup (about 20 minutes)

### 1. Create the database
1. Open your Supabase project (or create one).
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and edit two things first:
   - the email domain in `allowed_email()` (currently `@zuper.co`);
   - the staff list at the bottom: you as `owner`, and each lead / HR person as `admin`.
3. Click **Run**.

### 2. Turn on sign-in
In **Authentication → URL Configuration**:
- **Site URL**: where you'll host the Academy, e.g. `https://academy.zuper.co`.
- **Redirect URLs**: add the same URL and the same URL followed by `/**` (so password-reset links can return with `?reset=1`), plus `http://localhost:3000` and `http://localhost:3000/**` for local testing.

In **Authentication → Providers**, enable one or both:
- **Email** (email + password): learners create an account with their work email and a password (at least 8 characters; set **Minimum password length** to 8 under Authentication → Providers → Email), confirm the address once from an email, then sign in with email and password. "Forgot password?" emails a reset link. Keep **Confirm email** turned on: it's what proves someone owns the work address they signed up with. For real use, configure a custom SMTP sender under Authentication → Emails, because Supabase's built-in sender is rate-limited to a few emails an hour.
- **Google**: create an OAuth client in Google Cloud Console (Web application). Add the callback URL Supabase shows you as an authorised redirect URI, then paste the client ID and secret into Supabase. The site asks Google for your Workspace domain only.

Turn off whichever method you don't use in `config.js` (`AUTH`).

### 3. Connect the site
Open `config.js` and fill in:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` from **Project Settings → API**. The anon key is designed to be public; the access rules protect the data.
- `LOGO_SRC`: currently `assets/zuper-logo.webp`. It's shown on a small white rounded tile so it reads in both light and dark themes.
- `DECK_URL`: the slide deck link. The current claude.ai link only opens for people you've shared the deck with. You can download the deck as PowerPoint or PDF, put it in `assets/`, and point this at it instead.

### 4. Test locally
From this folder run `npx serve -l 3000 .` and open http://localhost:3000. Opening `index.html` directly from disk won't work, because sign-in needs a web address.

### 5. Deploy
- **Vercel**: `npx vercel` from this folder (or drag the folder into the Vercel dashboard). No framework, no build command, output directory = the folder itself.
- **Anywhere else**: upload the folder to any static host (Netlify, Cloudflare Pages, an S3 bucket, an internal web server).

Then add the deployed URL to Supabase's Redirect URLs if you haven't already.

## Who sees what

| Person | How they get access | What they see |
|---|---|---|
| Learner | Signs in with a work email | The Academy and their own progress only |
| Lead / HR / leadership | Their email is in `public.staff` as `admin` | Everything above, plus the **Team dashboard** |
| Owner | Their email is in `public.staff` as `owner` | Everything above, plus deleting a learner's record |

Add or remove staff any time in **Table Editor → staff** (or with SQL). Staff who open the Academy are asked whether they're taking the training or reviewing the team; reviewers are left out of the learner table and averages.

The rules are enforced in the database, not just the page: learners can only read and write their own row, and only signed-in accounts on your domain can save progress. Someone from another domain can create a Supabase login, but the site signs them straight out and the database refuses their data.

## What's stored

One row per learner in `public.progress`: their user id, email, name and avatar from their sign-in, and a JSON document with quiz answers and scores, attempts, completion dates, lessons watched, role and cohort, and their written case-study answers. Learners are told on their first visit that leads and HR can see this, including the sign-in log below.

### Sign-in log

Every completed sign-in adds a row to `public.sign_ins`: email, time, browser/device and IP address. A database trigger on `auth.sessions` writes it, so it can't be skipped or changed from the browser, and a problem writing the log never blocks a sign-in. Sign-ins from other domains are logged too, even though the site signs those people straight out.

Only staff (`admin` or `owner`) can read the log. It appears in the **Sign-ins** section of the Team dashboard (counts, a searchable list of the newest 200, and a CSV download of everything in the chosen time range), and each learner's detail view shows their sign-in count and last sign-in. Refreshing an existing session doesn't count as a new sign-in.

## Differences from the claude.ai version
- Narration uses the browser's built-in voices (Chrome and Edge have the most natural ones). Claude's voice is only available inside claude.ai.
- Progress from the claude.ai version doesn't carry over; learners start fresh here.
- The dashboard updates live via Supabase Realtime, and refreshes every minute as a fallback.
