# AI context — read first

Starlink Fleet System is a local-first fleet operations web application being prepared for later VPS deployment. It combines CMSV6 and Cartrack live locations, resolves conflicts, groups vehicles, and tracks trips from assignment through start, destination, return, or the next trip's start.

## Current truth

- Canonical repository: `https://github.com/olam-devs/fleet-system`
- Primary branch: `main`
- Stack: Vinext/Next-compatible React, TypeScript, Leaflet, Cloudflare D1-compatible SQLite, Drizzle schema.
- Live providers: CMSV6 primary, Cartrack secondary.
- Real secrets belong in ignored `.env.local`; see `.env.example` and `docs/SETUP.md`.
- The system is in local development, not production. Do not deploy unless the owner explicitly requests it.

Read `docs/PROJECT_STATUS.md` for the implementation boundary and `docs/INDEX.md` to locate only necessary files. Record durable architectural choices in `docs/DECISIONS.md`, not only in chat.

The direction is to turn the working live map and early trip workflow into a reliable operational system: durable observation/history ingestion, complete trip controls, workshop workflows, authentication/roles, notifications, tests, and VPS deployment.

