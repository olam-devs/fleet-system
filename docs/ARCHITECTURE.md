# JourneyOps architecture

## Purpose

JourneyOps assigns vehicles to journeys, follows them to the starting point and destination, records the return or movement to the next assignment, and monitors workshop deadlines. Fuel, video, vehicle control, and generic fleet reporting are outside scope.

## Runtime shape

1. Provider adapters poll CMSV6 and Cartrack from the server. Browser clients never receive provider credentials.
2. Today, live provider polling happens on server API requests; the planned worker will store raw observations with GPS and receipt timestamps.
3. The location resolver selects one operational position while preserving both sources in the current merge result.
4. The initial trip-state engine evaluates geofence transitions. Consecutive-point confirmation and immutable audit events remain required.
5. Groups and trips use the local database. Continuous trip route history is not yet persisted.
6. The target architecture reads completed route history from our database and uses provider history only to repair identified gaps.

## Location policy

- CMSV6 is primary when both sources are fresh and agree.
- CMSV6 `gpsValid=false` (shown by the vendor as **untargeted**) invalidates that observation. If Cartrack has a fresh usable position, Cartrack becomes the temporary fallback even when the CMSV6 response itself is recent.
- Cartrack positioning quality is stored as `unknown` until its live payload is verified for a comparable validity flag. A current timestamp and valid coordinate range make it usable, but not positively "targeted".
- A fresh Cartrack position can replace stale CMSV6 data.
- Two fresh, usable positions separated by more than 200 metres are marked as a conflict. CMSV6 remains the selected operational position, but automated arrival/departure changes pause until the conflict clears or is confirmed.
- An observation is fresh for two minutes and stale after ten minutes by default. These thresholds remain configurable.
- State changes require consecutive qualifying observations to avoid GPS jump errors.
- Cartrack `gps_fix_type` values 0–1 are untargeted; 2–3 are targeted, following the current official Fleet API schema.

## Security boundaries

- Use a restricted, read-only Cartrack sub-user. Never use the administrator API key.
- Store provider secrets only in runtime environment variables or a secret manager.
- Never commit `.env`, passwords, API keys, session tokens, or production database files.
- All trip corrections are audited with actor, timestamp, prior state, and reason.

## VPS direction

The first local slice uses the generated SQLite-compatible persistence layer. Before VPS production, persistence will be placed behind a repository interface and configured for PostgreSQL, with a separate background worker for provider polling, state evaluation, and notifications. The web server and worker will be deployable as containers.
