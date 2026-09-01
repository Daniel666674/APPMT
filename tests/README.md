# Tenant isolation tests

One deployment serves every client, so the thing that must never break is
that a business can only ever see and modify its own data. These two scripts
prove it against a real running server and a real database — no mocks.

- `tenant-isolation.mjs` — the public surface. Cross-tenant ids on the
  booking and availability APIs, cross-tenant slugs on the public pages, the
  admin pages while signed in as another business, and the double-booking
  constraint.
- `tenant-isolation-actions.mjs` — the authenticated surface. Every admin
  server action (create/update/delete for staff, services, appointments,
  availability and settings) is invoked for real with **another business's
  ids**, then the database is checked to confirm nothing moved.
- `account.mjs` — the signed-in person's own account. Changing the platform
  admin's password changes the login behind every agenda, so this checks the
  current password is genuinely required, the new one takes effect and the
  old one stops working, and that an email already in use is refused.
- `first-run.mjs` — `/setup` on an empty deployment. Checks it asks for
  nothing but an account, that the account it creates runs the platform and
  **belongs to no business**, that no agenda is invented for it, and that the
  page steps aside once one exists. **Needs its own empty database.**
- `recovery.mjs` — `/recuperar`, the one route that sets a password without
  knowing the old one. Checks the SETUP_SECRET gate reveals and changes
  nothing when it fails, that a reset actually works, that it restores
  platform access only when nobody holds it, and that guessing the secret
  gets rate-limited. Needs `SETUP_SECRET` set to match the server.
- `demo-builder.mjs` — the reseller console: the demo builder, the prospect
  CRM and tracked demo links. Checks a business owner's login is refused by
  every one of those actions (**including on their own agenda** — what stops
  them is the platform gate, not tenant scoping), that saving writes the whole
  agenda in one go, that a service with bookings is **deactivated and never
  deleted**, that a taken or reserved slug is refused, and that /s/<token>
  counts the open and forwards to the demo. It builds its own throwaway agenda
  and deletes it afterwards, so it never disturbs the seeded demos.
- `platform-admin.mjs` — the reseller privilege boundary. Platform access
  reaches every agenda, so this checks a client login cannot list, enter,
  create or delete another one — including with a **forged cookie** that
  simply claims `isPlatformAdmin`, or claims to already stand inside someone
  else's agenda. It also checks the platform admin genuinely can.

## Running them

They need a production build serving a seeded database, because server
actions are addressed by ids that only exist after a build.

```bash
# 1. point at a scratch database — these tests write to it
export DATABASE_URL="postgresql://…/appmt_test"
export DIRECT_URL="$DATABASE_URL"
export SESSION_SECRET="any-long-random-string-at-least-32-chars"

# 2. set it up
npm run db:migrate
npm run db:seed          # creates ten demo businesses

# 3. build and serve
npm run build
npm start -- -p 3100 &

# 4. run
TEST_URL=http://localhost:3100 node tests/tenant-isolation.mjs
TEST_URL=http://localhost:3100 node tests/tenant-isolation-actions.mjs
TEST_URL=http://localhost:3100 node tests/platform-admin.mjs
TEST_URL=http://localhost:3100 node tests/account.mjs
TEST_URL=http://localhost:3100 node tests/demo-builder.mjs
TEST_URL=http://localhost:3100 SETUP_SECRET=… node tests/recovery.mjs
# against a separate EMPTY database:
TEST_URL=http://localhost:3100 SETUP_SECRET=… node tests/first-run.mjs
```

Both exit non-zero if anything fails. They clean up after themselves, so
they can be run repeatedly against the same seeded database.

Do **not** point them at a production database — they create and delete
bookings and customers.
