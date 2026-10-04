# Project status

Last updated: 2026-10-04

## Working now

- Starlink Fleet System overview, Map mode, and Trips routes.
- Real CMSV6 and Cartrack data through server-only adapters.
- CMSV6-first location resolution with untargeted, freshness, fallback, and conflict handling.
- CMSV6 pseudo-plates (registration equal to device ID) are excluded.
- Helion vehicle artwork, heading rotation, status colours, and tap-to-zoom clustering.
- Data ages in minutes, hours, and days.
- Editable groups and optional subgroups; CMSV seeds Distribution, Semi, and Excavator without locking assignments.
- Initial durable trip creation and progression through start, outbound, destination, return, or queued next-start movement.
- D1-compatible schema and migrations for groups, trips, observations, route points, workshop stays, and notifications.

## Last verified live snapshot

- 138 visible vehicles with genuine registrations.
- Both providers connected successfully.
- Distribution 40, Semi 45, Excavator 1, Ungrouped 52.
- No demonstration trips inserted.

These counts are a time-stamped observation, not hard-coded assumptions.

## Important limitations

- Polling occurs when live APIs are requested; no persistent background ingestion worker is running yet.
- Continuous observation and route history are not yet written by a worker.
- Trip creation accepts named coordinates and can copy the current vehicle point; map-click selection remains.
- Trip transitions need audit events, correction controls, consecutive-point confirmation, and automated tests.
- Group rename/delete and richer hierarchy controls remain.
- Workshop pages, reminders, authentication, roles, notifications, and deployment are incomplete.
- VPS persistence and worker architecture remain to be implemented.

## Verification

- `npm run lint`
- `npm run build`
- `npm audit --omit=dev` — zero production vulnerabilities
- `/`, `/map`, `/trips`, `/api/groups`, `/api/trips`, and `/api/vehicles/live` responded successfully

## Git handover

- Product commit before these documents: `ff6ae03`
- Branch: `main`
- Canonical remote: `https://github.com/olam-devs/fleet-system`

