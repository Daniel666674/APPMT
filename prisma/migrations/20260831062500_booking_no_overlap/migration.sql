-- Enforce, at the database level, that a staff member can never have two
-- active (PENDING or CONFIRMED) bookings whose time ranges overlap. This
-- closes the race condition that a plain "check then insert" in application
-- code cannot fully close under concurrent requests for the same slot.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));
