# Decisions

## D-001 — Dual-provider policy

CMSV6 is primary when targeted and current. Cartrack is fallback when CMSV6 is unusable or stale. Material disagreement between current valid sources is shown as a conflict.

## D-002 — Store operational history locally

Provider APIs are for ingestion, not repeated reconstruction of completed trips. A background worker must store observations, selected trip points, and events so route traces and completed history load from our database.

## D-003 — Local group ownership

CMSV6 membership initializes Distribution, Semi, and Excavator. Starlink Fleet System then owns editable assignments; provider groups do not lock vehicles.

## D-004 — Genuine registrations only

CMSV6 registrations equal to their device identifier are hidden. A valid Cartrack-only registration may appear.

## D-005 — No fuel scope

Fuel readings and vehicle-control functions are excluded. Scope is location, trips, return/next-start tracking, workshops, reminders, and history.

## D-006 — Secrets never enter Git

Every trusted machine receives `.env.local` separately and checks it against `.env.example`.

## D-007 — Local first, VPS later

Development remains local until accepted. Production will use a VPS database and separate ingestion worker rather than browser traffic.

