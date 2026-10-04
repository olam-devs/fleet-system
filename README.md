# Starlink Fleet System

Starlink Fleet System is a web application for real-time vehicle visibility, editable fleet groups, trip assignment, destination/return tracking, and planned workshop monitoring. It combines CMSV6 and Cartrack location evidence while presenting one operational position per vehicle.

## Implemented

- Live overview and clustered fleet map using real provider data
- CMSV6-primary, Cartrack-fallback location resolution
- Invalid CMSV device-ID registrations excluded
- Helion-style directional vehicle markers
- Editable groups/subgroups seeded from CMSV6
- Initial persistent trip workflow through return or the next trip's start
- D1-compatible relational schema and migrations

## Start here

- AI/developer rules: `AGENTS.md`
- Short context: `AI_CONTEXT.md`
- Current boundary: `docs/PROJECT_STATUS.md`
- New-computer setup: `docs/SETUP.md`
- File routing: `docs/INDEX.md`
- Decisions and roadmap: `docs/DECISIONS.md`, `docs/ROADMAP.md`

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Real environment values are never stored in Git. See `docs/SETUP.md`.
