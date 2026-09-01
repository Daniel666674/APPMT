# Handoff prompt

Everything below the line is written to be **pasted into a fresh Claude Code
session** on this repo. It describes what exists, what must not change, and the
two things that are actually missing.

---

I'm Daniel (BlackScale Consulting, Colombia). This repo is APPMT: a white-label
appointment scheduler I sell to small Colombian businesses — barberías, spas,
consultorios, talleres, veterinarias. One deployment serves every client. I sell
cheap and I sell volume, so setting up a new client has to cost me minutes, not
hours.

It works today. I want to keep going, not start over. **Read this whole file,
then read the code before proposing anything.**

## Where it stands

- **Live:** https://appointment-omega-five.vercel.app
- **Repo:** `Daniel666674/APPMT`. `main` auto-deploys to Vercel.
- **Database:** Neon Postgres (pooled `DATABASE_URL`, direct `DIRECT_URL`).
- **Stack:** Next.js 16.3.3 App Router + Turbopack, React 19, Prisma 6.19,
  Tailwind v4 (CSS-first), custom auth (`jose` + `bcryptjs`), Resend for email.
- **Tests:** 142 assertions across 6 suites in `tests/`, run against a real
  production build and a real database. No mocks. See `tests/README.md`.

## Rules that are already settled — don't reopen them

1. **Spanish only**, Colombian idiom. No English anywhere a customer or a
   business owner can see. Money is **COP** and only COP (`Business.currency`
   exists so the formatter has one source of truth; it is not editable).
   Timezone is `America/Bogota`.
2. **There is no self-service signup.** Nobody creates an account on their own.
   I create every agenda.
3. **This is not the Next.js in your training data.** Read the relevant guide in
   `node_modules/next/dist/docs/` before writing Next code. `proxy.ts` replaces
   `middleware.ts`; `params` and `searchParams` are async.
4. **Never let the build wipe, reset or force-push the database.** A failed
   migration is repaired forward (`prisma/repair/failed-migration.sql`), never by
   dropping data. There are paying clients behind this eventually.
5. **Migrations must survive a populated database.** Add nullable → backfill →
   `SET NOT NULL`. A `NOT NULL` column added in one step already broke production
   here once.
6. Run the suites before you push, and add assertions for whatever you change.

## The URL model — three doors, and only three

| URL | Who | What |
| --- | --- | --- |
| `/setup` | me, once per deployment | Creates the one superadmin account. Asks for email, password and `SETUP_SECRET` — **nothing else**. No sector, no brand, no hours. Steps aside (with an explanation, pointing at `/recuperar`) once an account exists. |
| `/admin/login` → `/admin/*` | me | My whole console. |
| `/` | the public | Library of demos I can share. |
| `/<slug>` | a lead or a real customer | One agenda's public booking page. No login. This is the link I send to sell. |
| `/<slug>/admin` | a client who bought | That business owner's own door, next to their own booking page. Scoped to their agenda only. |
| `/manage/<token>` | a customer | Their own appointment. Cancel only. |
| `/recuperar` | me, when locked out | `SETUP_SECRET`-gated: lists the accounts, resets a password, restores platform access if nobody holds it. |

## The account model — this is the keystone

`User.businessId` is **nullable**.

- `null` → the superadmin. Belongs to no business, therefore reaches all of them.
  That nullability is exactly why `/setup` doesn't have to ask me for a brand.
- non-null → a business owner, pinned to that one agenda forever.

`isPlatformAdmin` is **re-read from the database on every request** — never
trusted from the session cookie. A forged cookie claiming it is refused, and
`tests/platform-admin.mjs` proves that.

Entering an agenda from `/admin/negocios` points my session at it, so citas,
servicios, equipo, horarios and marca all edit that business with no second
login.

## What already exists (don't rebuild it)

- **Booking correctness is enforced by the database**, not by application code:
  a Postgres `EXCLUDE USING gist` constraint (`booking_no_overlap`, needs
  `btree_gist`) makes a double booking impossible even under a race.
- **Availability engine** — per-staff weekly hours (`Availability`), one-off
  overrides and business-wide holidays (`TimeOff`), slot interval, buffer,
  minimum notice, max advance days.
- **Admin sections** under `/admin`: citas (with a create dialog and status
  menu), servicios, equipo (+ per-staff availability editor), clientes,
  ajustes (General / Marca / Festivos), negocios, cuenta.
- **Agenda creator** — a 5-step wizard with live preview at
  `/admin/negocios/nueva`, for a *client's* branding.
- **One-click demo library** — "Crear las N demos que faltan" builds one agenda
  per sector from `src/lib/industries.ts` (15 presets, each with services,
  prices, staff and hours already loaded). Zero typing. This is what I use for
  demos; the wizard is for real clients.
- **Brand kit** → CSS custom properties at runtime (`src/lib/theme.ts`): colors,
  font, light/dark, corner style, logo, favicon, hero image, hero copy, about
  text, contact block, WhatsApp button, socials.
- **Email** — React Email templates (confirmation, reminder, cancellation, new
  booking notice) via Resend. Without `RESEND_API_KEY` it logs instead of sending,
  so nothing breaks in dev.
- **`global-error.tsx`** — diagnoses "DB has no tables" / "can't reach DB" /
  "bad credentials" / "missing SESSION_SECRET" in Spanish, instead of the host's
  blank error page.

Schema lives in `prisma/schema.prisma`: `Business`, `User`, `Staff`, `Service`,
`ServiceStaff`, `Availability`, `TimeOff`, `Customer`, `Booking`. Every
tenant-owned model carries `businessId`.

## The two things that are actually missing

These are what I want the next stretch of work to be about. **Don't start
building until we've agreed on scope — ask me first, with a concrete plan.**

### 1. A real backend

The data layer is already real (Postgres, migrations, DB-enforced correctness,
server actions). What is *not* real yet is everything around it. In the order I'd
guess matters:

- **Uploads.** `logoUrl`, `faviconUrl` and `heroImageUrl` are URLs I paste by
  hand. A client will send me a PNG on WhatsApp. This needs real file upload +
  storage (Vercel Blob is the obvious fit) with resizing.
- **Notifications Colombians actually read.** WhatsApp is where this market
  lives; right now WhatsApp is only a floating button on the booking page and all
  real notifications are email. Confirmations and reminders over WhatsApp
  (Cloud API or a provider) would change how sellable this is.
- **Reminders are limited by the plan, not the code.** Vercel Hobby allows one
  cron per day, so `/api/cron/reminders` runs at 13:00 UTC (08:00 Bogotá) and
  sweeps a 36-hour window — every booking gets exactly one reminder, but 12–36
  hours out, not a clean 24. Fixing this properly means a paid plan or an
  external scheduler.
- **Customer self-service stops at cancel.** `/manage/<token>` can't reschedule.
- **The clientes section is read-only** — no editing, no notes, no history, no
  export.
- **No payments or deposits.** No-shows are the number one complaint I hear.
  Wompi / Bold / Mercado Pago are the Colombian options.
- **The rate limiter is in-memory** (`src/lib/rate-limit.ts`), so it resets on a
  cold start and doesn't span instances. Fine as a speed bump, not real
  protection. Upstash or a DB-backed limiter would be.
- **Nothing tells me how my demos are doing.** As the reseller I'd want, per
  agenda: bookings this month, when it was last opened, which link I shared.
- **No audit trail and no stated backup story.**

### 2. A demo editor

Everything is editable today, but only by walking into an agenda and hopping
between five sections. To shape a demo for a specific lead — swap the services
and prices, rename the staff, set the hours, drop in their colors and logo — I'm
clicking through servicios, then equipo, then horarios, then ajustes, then marca.
That's too slow when I'm on a call with someone.

What I want is **one screen that shapes an existing agenda end to end**: the
creator wizard's speed and live preview, but pointed at an agenda that already
exists — edit its services and prices inline, its staff, its hours, its brand,
see the booking page update beside me, save once.

Worth considering as part of it: duplicating an agenda, resetting a demo back to
its sector preset after I've messed it up on a call, and clearing test bookings.

**Both of these readings are my interpretation of my own two-line note. Tell me
what you'd build, in what order, and what you'd cut — then let me pick.**

## Working on this

```bash
# local
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appmt_dev?schema=public"
export DIRECT_URL="$DATABASE_URL"
export SESSION_SECRET="any-long-random-string-at-least-32-chars"
export SETUP_SECRET="another-long-random-string"
npm install
npm run db:migrate && npm run db:seed
npm run dev
```

Tests need a production build serving a seeded database (server actions are
addressed by ids that only exist after a build) — `tests/README.md` has the exact
sequence. `tests/first-run.mjs` needs its own **empty** database.

- Develop on `claude/appointment-scheduler-design-n673et`, push there, open a
  draft PR.
- Verify things instead of assuming them. If something fails, reproduce the
  failure first, then fix it, then show me it passing. I've been burned by
  confident guesses on this project.

## Loose ends you should know about

- **Rotate the Neon credentials.** They were pasted into a chat during setup and
  should be treated as compromised.
- `SETUP_SECRET` is the master key, not just an install code: via `/recuperar` it
  can take over the deployment. It is documented that way in `.env.example` and
  the README.
- Production may still hold a stale superadmin account from earlier setup
  attempts; `/recuperar` is the way in.
- `.env.local` and `.env` are local only — never commit real values.
