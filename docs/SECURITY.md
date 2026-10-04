# Security

- Treat `.env.local`, API keys, passwords, sessions, database exports, and deployment keys as secrets.
- Keep the GitHub repository private and use least-privilege collaborators.
- Use a restricted, read-only Cartrack user rather than administrator credentials.
- Provider calls remain server-side; client components never receive secrets.
- Review diffs and scan for secrets before every push.
- Rotate any accidentally committed secret immediately and remove it from Git history.
- Production requires authentication, authorization, TLS, rate limiting, backups, monitoring, and restore procedures.
