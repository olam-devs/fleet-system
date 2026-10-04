# Starlink Fleet System — AI working agreement

This repository is the shared source of truth for every Codex, Claude, or other AI session. Do not rely on private chat memory when repository documentation answers the question.

## Start every session

Read these files in order:

1. `AI_CONTEXT.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/INDEX.md`
4. Only the feature files routed by `docs/INDEX.md`

Before editing, run `git status --short --branch` and preserve unrelated user changes. At session close, update `docs/PROJECT_STATUS.md` when implementation state, risks, or next steps changed.

## Product rules

- The public product name is **Starlink Fleet System**.
- This web application tracks vehicle locations, trip assignments, return/next-start movement, and workshop stays. It does not show fuel data.
- CMSV6 is the preferred location when its GPS is targeted and current. Cartrack is the secondary source and fallback.
- If both sources are current but materially disagree, keep CMSV6 selected and mark the record as a conflict.
- Never display a CMSV6 vehicle whose registration is blank or identical to its device ID.
- Preserve the Helion-style vehicle markers and tap-to-zoom marker clustering.
- CMSV groups seed local assignments, but local users must be able to move vehicles freely and create optional subgroups.
- Never invent dashboard counts, trips, alerts, or vehicle positions. Use real data or an explicit empty state.

## Security rules

- Never commit `.env.local`, real API credentials, cookies, tokens, database files, keystores, or deployment secrets.
- `.env.example` must contain every required variable with blank or harmless placeholder values.
- Browser code must never receive CMSV6 or Cartrack credentials; provider access stays server-side.
- Do not print secret values in logs, test output, documentation, screenshots, or chat.
- Do not push unless the owner requested it. This repository is intended to remain private.

## Quality gate

```powershell
npm run lint
npm run build
npm audit --omit=dev
```

For live-data work, also confirm `/`, `/map`, `/trips`, and `/api/vehicles/live` respond successfully without exposing credentials.

