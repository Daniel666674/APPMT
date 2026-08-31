# Appointment Scheduler

A white-label appointment booking platform built to be resold and re-skinned
for different service businesses (salons, barbershops, clinics, studios,
consultants, etc). One codebase, one deployment per client — each client gets
their own database and their own branding, all editable from an admin
dashboard with no code changes.

## What's included

- **Public booking site** — service list, staff picker, real-time available
  time slots, booking form, email confirmation with a calendar (.ics)
  attachment, and a no-login "manage my appointment" cancel link.
- **Admin dashboard** — day-by-day appointment schedule, manual booking
  creation, services & staff management, per-staff weekly hours + time off,
  a lightweight customer CRM, and a settings area for business info, booking
  rules, and **branding** (logo, colors, font, live preview).
- **Solid backend** — Postgres via Prisma, with a database-level exclusion
  constraint that makes double-booking impossible even under concurrent
  requests (not just an application-level check).
- **Fully themeable visuals** — every brand color, font, and piece of copy
  lives in the database and is rendered through CSS custom properties. A
  client rebrands their site from a settings form; you never touch code.
- **Email** — booking confirmations, cancellations, and 24-hour reminders via
  [Resend](https://resend.com), built with React Email.
- **Auth** — simple, self-contained session auth (bcrypt + signed JWT
  cookies) for the admin dashboard. No third-party auth service required.

## Tech stack

Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS v4
· Radix UI primitives · Resend + React Email · Zod · deployed on Vercel.

## Local development

Prerequisites: Node 20.9+, a Postgres 16+ database (local or hosted).

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL / DIRECT_URL at minimum
npm run db:migrate        # apply migrations (creates tables + the anti-double-booking constraint)
npm run db:seed           # creates a demo business, services, staff, and your first admin login
npm run dev
```

The seed script prints the admin login it creates (defaults to
`owner@example.com` / `changeme123` — override with `SEED_OWNER_EMAIL` /
`SEED_OWNER_PASSWORD` in `.env` before seeding). Sign in at `/admin`.

## Deploying a new client (Vercel + Neon)

This is the repeatable process for selling/deploying this to a new business.

### 1. Create the database

1. Create a free project at [neon.tech](https://neon.tech) (or Supabase /
   Vercel Postgres — any managed Postgres works).
2. Copy the **pooled** connection string → this is `DATABASE_URL`.
3. Copy the **direct/unpooled** connection string → this is `DIRECT_URL`
   (Neon shows both on the same connection details page; migrations need the
   direct one).

### 2. Deploy to Vercel

1. Push this repo to GitHub (or fork it per client) and import it in Vercel.
2. Add environment variables in the Vercel project settings — see
   `.env.example` for the full list. At minimum: `DATABASE_URL`,
   `DIRECT_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL` (your Vercel URL or
   custom domain), and `CRON_SECRET`.
3. Deploy. The build runs `prisma generate && prisma migrate deploy`
   automatically (`package.json` → `build` script) — tables and the
   anti-double-booking constraint are created on every deploy with no
   manual migration step.

### 3. Seed the first login

The one thing that still has to run from your own machine once per client,
because the app has no database rows at all until this runs (the schema
exists after step 2, but no `Business`/`User` row yet). Point your local
`.env` at the production `DATABASE_URL`/`DIRECT_URL` (or `vercel env pull`),
then:

```bash
npm install
SEED_OWNER_EMAIL="the-client@theirbusiness.com" SEED_OWNER_PASSWORD="a-strong-temp-password" npm run db:seed
```

This creates a demo `Business` row (placeholder name/services/staff) and the
client's first admin login. The client replaces the placeholder content with
their real business from the dashboard in step 5 below — it's a starting
template, not something you need to hand-edit with their real info first.

Tell the client to log in and change their password... there's no
self-service password change yet (see **Known limitations** below) — for now,
re-run the seed's `bcrypt.hash` step manually or update the `User` row via
Prisma Studio (`npm run db:studio`) if they need a reset.

### 4. Turn on email

Add a [Resend](https://resend.com) API key as `RESEND_API_KEY`, and set
`EMAIL_FROM` to an address on a domain you've verified with Resend. Without
this, the app works fully — emails are just logged to the server console
instead of delivered.

### 5. Rebrand for the client

Everything below is done by the client (or you, on their behalf) from
**`/admin/settings`** — no redeploy needed:

- **General tab** — business name, timezone, currency, contact info, social
  links, booking page headline/subheadline/about copy, and booking rules
  (slot interval, buffer time, minimum notice, how far ahead people can
  book, cancellation window, whether phone number is required).
- **Branding tab** — logo URL, favicon URL, primary/accent color (with a
  live preview), font, light/dark mode.
- **Holidays tab** — business-wide closed dates.

Then from the main nav: add **Services** (name, duration, price, color),
**Staff** (name, bio, color, which services they perform), and each staff
member's **weekly hours** and **time off** (via the calendar-clock icon next
to their name on the Staff page).

## Architecture notes

- **No double-booking, guaranteed at the database level.** Beyond the
  application-level availability check, `prisma/migrations/.../booking_no_overlap`
  adds a Postgres `EXCLUDE USING gist` constraint on `(staffId, tsrange(startsAt, endsAt))`
  for active bookings. Two concurrent requests for the same slot cannot both
  succeed — the second gets a clean 409 response — even though the
  application-level check alone would have a race window.
- **Single business per deployment, on purpose.** This is a white-label
  product: each client gets their own database, so there's exactly one
  `Business` row. That's a deliberate simplification over multi-tenant
  SaaS — it removes an entire class of "which tenant is this?" bugs and
  keeps every query simple, at the cost of needing a separate deploy per
  client (which the steps above make quick).
- **Timezones.** All scheduling math (weekly availability, slot generation,
  minimum notice, max advance window) is done in the business's configured
  IANA timezone (`Business.timezone`) via `date-fns-tz`, then stored in
  Postgres as UTC. Customers always see times in the business's local time,
  not their own — appropriate for an in-person appointment.
- **Auth.** Admin sessions are a signed JWT (via `jose`) in an httpOnly
  cookie, checked in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to
  `proxy.ts`) on every `/admin/*` request, with a second check in
  `requireSession()` on the server for defense in depth. Passwords are
  hashed with bcrypt. There's intentionally no third-party auth dependency.

## Known limitations / good next additions

- Single admin account per deployment (no multi-user staff logins yet, no
  in-app password reset — see step 3 above).
- No reschedule flow yet — customers cancel and rebook; admins can edit an
  appointment's status but not drag-and-drop reschedule.
- Logo/favicon are set by URL, not file upload (paste a link to an image
  hosted anywhere). Wiring up Vercel Blob for direct upload is a natural
  next step.
- The public booking rate limiter is in-memory per serverless instance —
  fine for blunting basic abuse, but swap in Upstash Ratelimit if you need
  it to hold across instances.
- No online payments — this is scheduling only. Stripe can be layered onto
  the booking flow without restructuring the schema.

## Project structure

```
prisma/schema.prisma          Data model
prisma/migrations/            Including the anti-double-booking constraint
src/lib/                      db, auth, availability engine, email, theme, validation
src/emails/                   React Email templates
src/components/ui/            Hand-built, Radix-based UI primitives (themeable)
src/components/booking/       Public booking flow components
src/components/admin/         Admin-only shared components
src/app/(public pages)        /, /book/[serviceId], /confirmation/[id], /manage/[token]
src/app/admin/(dashboard)/    Authenticated admin dashboard
src/app/api/public/           Booking creation, availability, cancellation
src/app/api/cron/reminders/   24-hour email reminder job (see vercel.json)
```
