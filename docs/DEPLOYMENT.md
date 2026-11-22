# Deploying for free

The free setup that fits this app best:

| Part | Service | Why |
|---|---|---|
| App (Next.js) | **Vercel** (Hobby plan) | Made for Next.js, deploys straight from GitHub, HTTPS included. |
| Database (PostgreSQL) | **Neon** (Free plan) | Real PostgreSQL, works with the app unchanged. |

Both have free tiers with limits that change over time. Check the current limits and terms on their pricing
pages before relying on them. At the time of writing: Vercel Hobby is free for **personal, non-commercial**
use, and Neon's free database has a small storage allowance and **pauses itself after a few minutes of
inactivity** (the first request after a pause is slower, usually 1 to 2 seconds).

## Before you start

- The code is on GitHub (https://github.com/teja516/dukaansaathi).
- Create a free account on [neon.tech](https://neon.tech) and on [vercel.com](https://vercel.com) (you can sign in with GitHub).
- Nothing here needs a credit card on the free plans. Never paste secrets into GitHub, chat or screenshots.

## 1. Create the database (Neon)

1. In Neon, create a project. Pick the region closest to your users (for India, an Asia-Pacific region such as Singapore).
2. Open **Connect**. You need **two** connection strings:
   - **Pooled** (the host contains `-pooler`). The app uses this one.
   - **Direct** (no `-pooler`). You use this once, from your computer, to create the tables.
3. Both end with `?sslmode=require`. Keep that part.

## 2. Create the tables (once, from your computer)

In PowerShell, in the project folder, using the **direct** string (the quotes matter):

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:push
```

Answer yes if it asks to create tables. Then close that PowerShell window, so the variable does not linger.

Optional, to load the sample shop (made-up data, marked "Sample") with the demo accounts:

```powershell
$env:DATABASE_URL = "<the same direct string>"
$env:DEMO_PASSWORD = "<a strong password you choose>"
npm run db:seed
```

For a real deployment, skip the seed and just create your account on the live site with **Create account**.

## 3. Deploy the app (Vercel)

1. In Vercel choose **Add New > Project**, import `teja516/dukaansaathi`. It detects Next.js on its own.
2. Before pressing Deploy, add these **Environment Variables**:

| Name | Value |
|---|---|
| `DATABASE_URL` | the **pooled** Neon string |
| `AUTH_SECRET` | a long random value (see below) |
| `NEXT_PUBLIC_SITE_URL` | your Vercel address, e.g. `https://dukaansaathi.vercel.app` (you can add it after the first deploy, then redeploy) |

Make the secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Press **Deploy**. When it finishes, open the address Vercel shows.
4. Recommended: in the Vercel project, **Settings > Functions**, set the region close to your Neon region
   (for example Singapore or Mumbai). Fewer kilometres between app and database means faster pages.

## 4. Check it works

- The landing page opens, and **Create account** works.
- You can finish the setup wizard, add a customer and a credit sale, and the dashboard shows it.
- Switch to हिन्दी and back.
- If something fails, open **Vercel > your project > Logs**.

## What the app already does for hosted databases

`src/lib/db.ts` detects a pooled connection (host containing `-pooler`, or `DATABASE_POOLED=true`) and then turns
off prepared statements (poolers cannot keep them) and keeps only a few connections per serverless instance.
Locally nothing changes. Payments still use database transactions and row locks, which work through the pooler.

## Things to know on free hosting

- **Cold starts:** a paused Neon database and a sleeping function add a second or two to the first request after
  a quiet period. Everything after that is fast.
- **Rate limiting:** the sign-in rate limiter is in memory, so on serverless it only protects each instance.
  The account **lockout after repeated failed sign-ins is stored in the database** and works everywhere.
- **Forgot password:** no email service is connected, so reset links are not delivered on a hosted site. Add an
  email provider before relying on that flow.
- **Backups:** free plans have limited backup or history windows. See [OPERATIONS.md](OPERATIONS.md) for how to
  take your own dump.
- **Demo data:** if you seeded the sample shop on a public site, anyone who knows the demo password can sign in.
  Use a strong password, or do not seed at all.
- **Terms:** Vercel Hobby is for non-commercial use. If this becomes a paid product, move to a paid plan.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Every page says "We could not load this" | `DATABASE_URL` is missing or wrong in Vercel. Fix it and redeploy. |
| `no pg_hba.conf entry` or SSL errors | The string is missing `?sslmode=require`. |
| `prepared statement ... does not exist` | A pooled string is in use but was not detected. Set `DATABASE_POOLED=true`. |
| `too many connections` | You used the direct string in Vercel. Use the **pooled** one. |
| Signed out on every visit | `AUTH_SECRET` changes between deployments. Set it once and keep it. |
| First load is slow, then fast | The free database was paused. This is expected on the free plan. |

## Other free options

- **Supabase** (free Postgres) works the same way with its pooled connection string. Free projects pause after a
  week of inactivity.
- **Render / Railway / Fly.io** can run the app as a long-lived server, but their free offers are limited or change
  often (for example free databases that expire). Check their current terms first.
