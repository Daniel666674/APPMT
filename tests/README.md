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
```

Both exit non-zero if anything fails. They clean up after themselves, so
they can be run repeatedly against the same seeded database.

Do **not** point them at a production database — they create and delete
bookings and customers.
