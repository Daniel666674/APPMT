# Appointment Scheduler

A white-label appointment booking platform built to be resold and re-skinned
for different service businesses (salons, barbershops, clinics, studios,
consultants, etc).

**One deployment serves every client.** Each business gets its own URL —
`tudominio.com/salon-aurora`, `tudominio.com/barberia-el-roble` — with its
own branding, services, staff, hours and customers, all editable from an
admin dashboard with no code changes. Adding a client is a form submission,
not a deploy.

## What's included

- **A URL per business** — every client books at `/su-negocio`, on the same
  deployment and the same database. Signing in as one business shows only
  that business's data; see **Tenant isolation** below.
- **An agenda creator with a live preview** — pick a sector, set the brand
  and hours, and watch the client's real booking page build itself beside
  the form. Ends with the shareable link.
- **One console for every agenda** — `/admin/negocios` lists them all;
  entering one points your session at it, so you edit its services, prices,
  staff, hours and brand from the same login. No separate account per demo.
- **A demo library at `/`** — every listed agenda with its own link, ready
  to share with a prospect in that trade.
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
- **Email** — booking confirmations, cancellations, and appointment reminders
  via [Resend](https://resend.com), built with React Email. Every email is
  branded with the business the customer actually booked with.
- **Auth** — simple, self-contained session auth (bcrypt + signed JWT
  cookies) for the admin dashboard. No third-party auth service required.

## Language and market

Built for **Colombia**, in Spanish only. Copy uses Colombian phrasing
throughout ("agenda tu cita", "aparta tu turno", "escoge", "celular"),
prices are **COP** everywhere with `es-CO` formatting, times run in
`America/Bogota`, and every booking page can carry a floating **WhatsApp**
button.

Currency is deliberately not user-editable — `Business.currency` stays COP
so the money formatter has one source of truth. Copy lives inline in the
components; there is no i18n layer, so another language means editing the
strings.

## Tech stack

Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS v4
· Radix UI primitives · Resend + React Email · Zod · deployed on Vercel.

## Local development

Prerequisites: Node 20.9+, a Postgres 16+ database (local or hosted).

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL / DIRECT_URL at minimum
npm run db:migrate        # apply migrations (creates tables + the anti-double-booking constraint)
npm run db:seed           # creates ten demo businesses, one per industry
npm run dev
```

The seed creates one business per industry preset, each at its own URL, so
`/` opens as a showcase you can walk a prospect through. It prints every
business it created and the admin login for the first one (defaults to
`owner@example.com` / `changeme123` — override with `SEED_OWNER_EMAIL` /
`SEED_OWNER_PASSWORD` in `.env` before seeding). Sign in at `/admin`.

Re-running the seed is safe: businesses whose owner email already exists are
skipped.

## Deploying (Vercel + Neon)

You do this **once**. After that, adding a client is step 3 repeated — no
new project, no new database, no redeploy.

### 1. Create the database

1. Create a free project at [neon.tech](https://neon.tech) (or Supabase /
   Vercel Postgres — any managed Postgres works).
2. Copy the **pooled** connection string → this is `DATABASE_URL`.
3. Copy the **direct/unpooled** connection string → this is `DIRECT_URL`
   (Neon shows both on the same connection details page; migrations need the
   direct one).

### 2. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add environment variables in the Vercel project settings — see
   `.env.example` for the full list. At minimum: `DATABASE_URL`,
   `DIRECT_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL` (your Vercel URL or
   custom domain), `CRON_SECRET`, and `SETUP_SECRET`.
3. Deploy. The build runs `prisma generate`, a migration-repair step, then
   `prisma migrate deploy` (`package.json` → `build` script) — tables and
   the anti-double-booking constraint are created on every deploy with no
   manual migration step.

   The repair step (`prisma/repair/failed-migration.sql`) exists because a
   migration that fails leaves a marker Prisma won't apply past (`P3009`),
   which would otherwise require someone to run SQL against the production
   database by hand before a fix could ever deploy. It names one specific
   migration, only touches a record that never finished, and is a no-op on a
   fresh database and on every later deploy. Delete it once every deployment
   you run has moved past that migration.

### 3. Create your first agenda

Open **`https://your-app.vercel.app/setup`**, which asks for `SETUP_SECRET`
and walks five steps — sector, business, brand, hours, access — with a live
preview of the booking page beside the form. It ends with the shareable URL.

The account created here is the **platform admin**: the one login that
reaches every agenda on the deployment. On an empty deployment the creator
requires it — an agenda with no login would leave nobody able to sign in —
so the first run asks for *your* email and password rather than offering the
demo option. After this you never need `/setup` again: create the rest from
**/admin/negocios → Nueva agenda**, signed in.

#### Demos vs. clients

The last step of the creator asks which kind of agenda this is, and the
distinction matters:

- **"Es una demo mía"** — creates no login at all. You manage it from your
  own account alongside every other agenda. This is how ten demos share one
  email and one password: there is one account, not ten copies of it.
- **"Es de un cliente"** — creates a login scoped to that agenda only. The
  client signs in, sees their own bookings, and cannot reach any other
  business or the console.

Either way the agenda's services, prices, staff, schedules and brand are
fully editable — for a demo, by entering it from the console.

The URL comes from the business name and is editable later at
**/admin/settings → General → Dirección web**. Changing it breaks previously
shared links, so settle on it early.

**Filling the demo library takes one click, not fifteen trips through the
creator.** `/admin/negocios` offers *"Crear las N demos que faltan"*, which
creates one agenda per sector straight from the presets — names, colors,
services, prices, team and hours all come with them, so there is nothing to
type. The creator is for a client's real branding; that button is for stock.
`npm run db:seed` does the same from a local checkout.

### Industry presets

`src/lib/industries.ts` ships ten verticals, each with its own colors,
hero copy, staff and realistic services priced in COP:

barbería · peluquería y salón de belleza · spa y estética · clínica dental
· consultorio médico · salón de uñas · estudio de tatuajes · entrenamiento
personal · veterinaria · consultoría

This exists to make selling easier. `npm run db:seed` creates one agenda per
preset, so `/` becomes a **library of live demos** — a prospect in any of
those trades can click straight into a booking page that looks like theirs
rather than placeholder text, and each demo has its own link to share on its
own. Add or edit presets in that one file.

A real client usually shouldn't sit in that public library: turn off
**/admin/settings → General → Visibilidad** (or the console's "Ocultar de la
biblioteca") and their page still works at its URL, it just stops being
listed on the front page.

### Brand identity

Everything a client sees is theirs, set from the creator or
**/admin/settings → Marca**, both with a live preview:

primary and accent color (ten ready palettes or any hex) · seven typefaces ·
corner style (rectas / suaves / muy redondeadas) · light or dark · logo ·
browser icon · hero cover photo · headline, sub-headline and about copy ·
WhatsApp button.

These render as CSS custom properties (`src/lib/theme.ts`), so a rebrand is
a form submission — never a deploy.

> **Note on passwords:** there's no self-service password reset yet (see
> **Known limitations**). Pick the client's password carefully at setup, or
> update the `User` row later via Prisma Studio (`npm run db:studio`).

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
- **Platform access is a database fact, not a cookie claim.** The session
  carries `isPlatformAdmin`, but `requireBusinessSession()` re-reads it from
  the database on every request, and an ordinary login is pinned to its own
  `businessId` — a cookie that claims otherwise is cleared, not honoured.
  `switchBusiness` is the only code path that rewrites a session's business,
  and it is gated the same way. Tested in `tests/platform-admin.mjs`,
  forged cookies included.
- **Tenant isolation.** Every tenant-owned row (`User`, `Staff`, `Service`,
  `Customer`, `Booking`, `TimeOff`) carries a `businessId`, and there are
  exactly two ways to establish which business a request is in: public pages
  resolve it from the URL slug (`getBusinessBySlug`), and admin pages
  resolve it from the signed-in session (`requireBusinessSession`). Nothing
  loads a business any other way. Ids arriving from the browser are never
  trusted: every admin read is filtered by `businessId`, and every admin
  mutation confirms ownership before it writes, so another business's id
  simply doesn't resolve. `tests/` proves this against a running server —
  see below.
- **Customers are per business.** The unique key is
  `(businessId, email)`, not `email`, so the same person booking at two
  different businesses is two independent customer records. Neither
  business sees the other's history.
- **Timezones.** All scheduling math (weekly availability, slot generation,
  minimum notice, max advance window) is done in the business's configured
  IANA timezone (`Business.timezone`) via `date-fns-tz`, then stored in
  Postgres as UTC. Customers always see times in the business's local time,
  not their own — appropriate for an in-person appointment.
- **Auth.** Admin sessions are a signed JWT (via `jose`) in an httpOnly
  cookie, checked in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to
  `proxy.ts`) on every `/admin/*` request, with a second check in
  `requireBusinessSession()` on the server for defense in depth. The session
  carries the `businessId`, so an admin session is bound to one business and
  cannot be pointed at another. Passwords are hashed with bcrypt. There's
  intentionally no third-party auth dependency.

## Tenant isolation tests

Because one deployment now holds every client's data, "business A cannot see
or touch business B" is the property that must never regress. `tests/` backs
it with 145 assertions against a real build and a real database — cross-tenant
ids on every public API, cross-tenant slugs on every public page, every admin
server action invoked for real with another business's ids, and every
reseller-level route and action attempted from a client login and from a
forged platform cookie — then the database checked to confirm nothing moved.

```bash
node tests/tenant-isolation.mjs          # public surface
node tests/tenant-isolation-actions.mjs  # admin server actions
node tests/platform-admin.mjs            # reseller privilege boundary
node tests/account.mjs                   # your own login and password
node tests/recovery.mjs                  # the locked-out recovery route
node tests/first-run.mjs                 # first agenda must create the superadmin (empty DB)
```

See `tests/README.md` for the setup they need. Run them after any change to
a query, a route, or the session.

## Known limitations / good next additions

- One admin account per business (no multi-user staff logins yet). You
  change your own email and password at **/admin/cuenta**. There is no
  "forgot my password" email; instead **/recuperar** lets whoever holds
  `SETUP_SECRET` list the accounts and set a new password on any of them —
  that is how you get yourself back in, and how you reset a locked-out
  client. Because it grants that, treat `SETUP_SECRET` as the master key to
  the deployment.
- Adding a business requires the platform account or `SETUP_SECRET`; there's
  no self-service signup, which is deliberate for a reseller product but
  means you onboard each client yourself.
- Logo, favicon and cover photo are set by URL, not uploaded. Vercel Blob is
  the natural next step.
- Businesses share one database. That's what makes a single deployment work,
  but it also means a client's data lives alongside other clients' — if you
  sell to someone who contractually requires physical separation, give them
  their own deployment.
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
src/lib/business.ts           How a request resolves which business it's in
src/lib/industries.ts         The fifteen sector presets
src/lib/theme.ts              Brand kit -> CSS custom properties
src/lib/agenda-creator.ts     One code path behind both creator entry points
src/components/creator/       The creator wizard and its live booking preview
src/lib/provision.ts          Creates a business + its demo data
src/app/page.tsx              Public directory of all listed businesses
src/app/[slug]/               One business's public booking site
src/app/manage/[token]/       No-login cancel page (business comes from the booking)
src/app/setup/                First-run creator (SETUP_SECRET gated)
src/app/recuperar/            Locked-out recovery (SETUP_SECRET gated)
src/app/admin/(dashboard)/negocios/   Console: every agenda, and the creator
src/app/admin/(dashboard)/cuenta/     Your own login: name, email, password
src/app/admin/(dashboard)/    Authenticated admin dashboard, scoped to one business
src/app/api/public/           Booking creation, availability, cancellation
src/app/api/cron/reminders/   Daily email reminder job, all businesses (see vercel.json)
tests/                        Tenant isolation tests
```
