# Roadmap

## Next — trustworthy trip operations

1. Add map selection and reusable saved locations for start, destination, and return.
2. Add trip detail with route line, timeline, elapsed time, distance, and source evidence.
3. Persist observations and trip points continuously through a background worker.
4. Add manual correction/cancellation with immutable audit events.
5. Test geofences, stale/conflicting data, queued trips, and return completion.

## Then — workshop operations

1. Record workshop entry, reason, allowed days, and expected release.
2. Show current, due-soon, overdue, and released stays.
3. Generate durable reminders and connect notification delivery later.

## Production readiness

1. Authentication and role-based permissions.
2. VPS database and migrations.
3. Dedicated polling/state worker with retries and monitoring.
4. Backups, observability, rate limits, security review, and deployment docs.
5. End-to-end testing in a production-like environment.

