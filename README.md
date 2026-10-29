# BeanWater

A dark-mode social log for specialty coffee: record extractions and roasts, tag them with the SCA flavor wheel, and browse what the community is brewing.

**Stack:** Next.js 15 (App Router, Server Actions, TypeScript) · Tailwind CSS v4 + shadcn-style primitives · Neon Postgres + Prisma 6 · Clerk · Recharts · framer-motion · ogl (React Bits–style Aurora background) · jszip

## Pages

| Route | What it does |
| --- | --- |
| `/` | Community feed of brews and roasts with All / Brews / Roasts toggle. Cards show the top 5 flavor tags; hover "+X more" for the rest. |
| `/brew` | Record an extraction: bean (name + producer/roaster required; varietal, process, elevation optional), dose, yield, grind, time, temp, and a 3-tier SCA flavor picker with a link to the WCR Sensory Lexicon. |
| `/roast` | Record a roast: machine, batch, charge temp, first crack, drop. Live simulated curve preview. `.alog` upload is a locked Pro feature. |
| `/brew/[id]`, `/roast/[id]` | Detail views with full parameters, equipment blurbs, roast curve (BT / ET / RoR), and a ZIP export (`.alog` + `.md`). |
| `/profile/[id]` | Profile shelf: followers, following, credentials, equipment shelf, bean history, past logs. |
| `/roast-me` | Pro-locked AI roast generator showcase with sample Skywalker V2 profiles and a Free vs Pro comparison. |

## Demo accounts

The seed creates two fictional reviewer personas (plus five community members, 5 roasters, 8 beans and 12 logs):

| Email | Name | Credentials |
| --- | --- | --- |
| `reviewer1@beanwater.demo` | Mara Quintero (Pro) | Q Grader, National Barista Finalist |
| `reviewer2@beanwater.demo` | Theo Lindqvist | Coffee Educator & Sensory Analyst |

**Auth modes**

- **No Clerk keys (demo mode):** everything is browsable, and new brews/roasts are attributed to `reviewer1`. The nav shows a "Demo mode" badge. Works locally and deployed.
- **With Clerk keys:** set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`; logging requires sign-in. Signing in with an email that matches a seeded user links you to that profile. For local dev, `npx clerk@latest init --accountless` writes temporary keys without a Clerk account (Clerk v7 no longer runs keyless automatically).

## Running locally

```bash
npm install
npx neon@latest deploy        # pulls DATABASE_URL / DATABASE_URL_UNPOOLED into .env.local
npm run db:push               # create tables
npm run db:seed               # reset + seed demo data
npm run dev
```

Prisma reads `.env.local` through `dotenv-cli` in the `db:*` scripts.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon **pooled** connection string (`-pooler` host) |
| `DATABASE_URL_UNPOOLED` | yes | Neon direct connection string (used by Prisma migrations / `db push`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | no | Enables real sign-in in production |
| `CLERK_SECRET_KEY` | no | Pair with the publishable key |

## Data model

`User` (credentials, `isPro`) · `Follow` (self-relation) · `Roaster` · `Bean` (unique per roaster) · `Equipment` · `Extraction` · `Roast` (curve stored as JSON). Flavor tags are stored as SCA paths, e.g. `Fruity > Berry > Blackberry`, so the top-level category drives chip color.

## Scope notes

- `.alog` upload and the AI "Roast Me" generator are deliberately locked as Pro features; roast curves are generated from roast milestones (`src/lib/mock-curve.ts`).
- The exported `.alog` imitates Artisan's format and is sample data, not a byte-compatible Artisan file.
