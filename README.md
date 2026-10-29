# BeanWater

**Strava for coffee.** Log your extractions and roasts, describe them with the SCA Coffee Taster's Flavor Wheel, follow other coffee people, and ask Benny — an AI roast SME — to draft a roast profile for your next bean.

- **Live:** https://casper-take-home-coffee.vercel.app
- **Stack:** TypeScript end to end — Next.js 15 (App Router, Server Actions) · Neon Postgres + Prisma 6 · Clerk auth · Vercel AI SDK + Claude · Tailwind v4 · Recharts · framer-motion · jszip

## Who it's for

Home brewers and roasters who want to remember what worked, and learn from people dialing in the same beans. Roasting has a steep learning curve; sharing roast milestones, curves and resulting flavor notes lowers it.

## What works

| Area | Details |
| --- | --- |
| **Auth & onboarding** | Clerk sign-up / log-in, protected logging routes with redirect-back, 3-step onboarding (handle, credentials, equipment shelf). |
| **Feed** (`/`) | *Following* feed of people you follow, *Discover* for everyone; Brews / Roasts filter. Cards show bean, roaster and the top 5 colored SCA notes, with "+N more" on hover. |
| **Record Brew** (`/brew`) | Bean (name + producer/roaster required; varietal, process, elevation optional), method, equipment, dose / yield / live ratio, grind, time, temp, rating, and the flavor wheel. |
| **Flavor wheel** | 3-tier SCA picker (category → subcategory → attribute) in SCA colors, breadcrumb chips, search, structured JSON output, and a WCR Sensory Lexicon drawer with definitions and references. |
| **Record Roast** (`/roast`) | Machine, batch, charge temp, first crack, drop time/temp, live development % and simulated curve preview. |
| **Detail pages** | `/brew/[id]`, `/roast/[id]` with full parameters, equipment blurbs, BT/ET/RoR curve and a `.alog` + `.md` ZIP export. |
| **Profiles** (`/profile/[id]`) | Follow / unfollow, follower & following counts, credentials, equipment shelf with per-item brew/roast counts, bean history, past logs. |
| **Benny** (`/roast-me`) | AI roast profile for your bean on a Skywalker V2, grounded on similar community roasts in the database. Strategy write-up, milestones, curve chart and a downloadable roast package (`profile.alog`, `roast-profile-strategy.md` and a branded PDF). 3 free generations per account (Pro accounts, like seeded Mara, are unlimited), enforced atomically server-side. |

## What's incomplete

- **`.alog` upload** is shown as a locked Pro feature; curves on logged roasts are simulated from milestones (`src/lib/mock-curve.ts`).
- **Pro / billing** is not wired — after 3 Benny generations the upgrade card is a placeholder.
- The exported `.alog` imitates Artisan's format but is not guaranteed to load in Artisan.
- No editing/deleting of posts, and no comments or likes.
- Auth runs on a Clerk **development** instance (shows a "Development mode" badge; fine for review, would move to a production instance with a custom domain).

## Demo accounts

Seeded fictional profiles (plus 5 community members, 5 roasters, 8 beans, 12 logs): **Mara Quintero** (`reviewer1@beanwater.demo`, Q Grader) and **Theo Lindqvist** (`reviewer2@beanwater.demo`, Coffee Educator). **To try it, just sign up** with any email — onboarding walks you through it, and you can follow Mara, Theo and the others from the feed. (If a Clerk user is created for a seeded email, signing in with it links to that seeded profile.)

## Run locally

```bash
npm install
cp .env.example .env.local          # then fill in the values below
npm run db:push                     # create tables
npm run db:seed                     # reset + seed demo data
npm run dev
```

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon pooled / direct connection strings (`npx neon@latest deploy` writes them) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk app keys. Without them the app runs in **demo mode** (no auth; writes attributed to the first reviewer). |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`, `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding` | Clerk routing |
| `ANTHROPIC_API_KEY` | Enables Benny. Without it Benny reports that it's offline and no credit is spent. |

## Architecture notes

- **Data model:** `User` (credentials, `aiUsageCount`, `onboardedAt`) · `Follow` · `Roaster` · `Bean` (unique per roaster) · `Equipment` · `Extraction` · `Roast` (curve as JSON) · `RoastMeRun` (Benny inputs/outputs). Flavor tags are stored as SCA paths (`Fruity > Berry > Blackberry`); the category drives chip color.
- **Server Actions** validate with zod and never throw to the client; ownership is checked for linked equipment.
- **Benny** reserves a credit with a conditional `updateMany` before calling the model and refunds it on failure, so the 3-call limit holds under concurrent requests. Output is schema-validated structured data, not parsed free text.
- **Rate limiting:** every mutating Server Action runs a fixed-window counter (`src/lib/rate-limit.ts`) — one atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING` on the `RateLimit` table, keyed by viewer id (or client IP), failing open if the DB errors. Benny is capped at 3/min and 20/day, checked before a credit is reserved.
