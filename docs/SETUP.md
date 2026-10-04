# Setup on a new computer

Requirements: Git, Node.js 22+, npm, private repository access, and a separately supplied `.env.local`.

```powershell
git clone https://github.com/olam-devs/fleet-system.git
cd fleet-system
npm install
Copy-Item .env.example .env.local
# Fill .env.local securely. Never commit or paste its values into AI chat.
npm run dev
```

Open `http://localhost:3000/`, `/map`, and `/trips`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_APP_ORIGIN` | Trusted local or deployed origin |
| `CMSV6_BASE_URL` | CMSV6 base URL |
| `CMSV6_USERNAME` | CMSV6 account |
| `CMSV6_PASSWORD` | CMSV6 password |
| `CARTRACK_BASE_URL` | Cartrack Fleet API base URL |
| `CARTRACK_USERNAME` | Restricted read-only API user preferred |
| `CARTRACK_API_KEY` | Secret API credential |
| `MAPS_API_KEY` | Reserved; current OpenStreetMap tiles do not use it |

Move the actual `.env.local` between trusted computers with a password manager, encrypted archive, secure transfer, or direct removable media. Do not email or commit it.

Before development, read `AGENTS.md`, `AI_CONTEXT.md`, and `docs/PROJECT_STATUS.md`.

