# Starlink Fleet System

Starlink Fleet System is a focused vehicle-journey operations web application. It combines CMSV6 and Cartrack location evidence, manages scheduled trips and return movement, preserves completed route history, and raises workshop-overstay reminders. The repository keeps the internal package name `journey-ops` until the final deployment naming is agreed.

## Current foundation

- Responsive operations dashboard
- Dual-provider location-resolution policy
- Relational schema for vehicles, saved locations, trips, observations, route points, events, workshop stays, and notifications
- Local database migration workflow
- Secret-safe environment template
- Architecture prepared for a later VPS web-server and worker deployment

## Local development

Use Node.js 22 or later. Copy `.env.example` to `.env.local` and keep real values out of Git. The current dashboard uses representative data while provider adapters and authenticated workflows are built.

```bash
npm install
npm run dev
```

See `docs/ARCHITECTURE.md` for source-selection, storage, and VPS decisions.
