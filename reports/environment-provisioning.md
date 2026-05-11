# ScholarScout Environment Provisioning

Generated: 2026-05-11T08:23:40.127Z

## Local Rehearsal

- Local env file: `.env.prelaunch.local`
- Status: generated with local-only credentials and localhost URLs.
- Boundary: this is for prelaunch plumbing only, not public production traffic.

Run:

```bash
npm run rehearse:prelaunch -- --skip-smoke --env-file .env.prelaunch.local
```

## Production Values Still Needed

- `NEXTAUTH_URL`: deployed HTTPS ScholarScout URL.
- `NEXTAUTH_SECRET`: long random Auth.js secret in the hosting environment.
- Google or GitHub OAuth client id and secret.
- OAuth callback URL configured with the provider.
- `SCHOLARSCOUT_STAFF_EMAILS`: trusted staff allowlist.
- `SCHOLARSCOUT_HEALTH_TOKEN`: monitoring bearer token.
- Durable data adapter credentials: Vercel Blob token or hosted HTTP service URL/token.
- GitHub Actions secrets for readiness, smoke, and prelaunch workflows.

## Recommended Next External Actions

1. Choose production data adapter: `vercel-blob` for Vercel-native pilot storage, or `http` for a hosted service/CMS boundary.
2. Create OAuth app credentials for Google or GitHub.
3. Link/deploy the app in the hosting provider.
4. Add the production values to hosting and GitHub Actions secrets.
5. Run the prelaunch rehearsal workflow against the deployed URL.
