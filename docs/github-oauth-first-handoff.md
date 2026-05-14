# GitHub OAuth First Handoff

Use this path to launch ScholarScout authentication with GitHub OAuth first, then add Google OAuth later.

## Why GitHub First

GitHub OAuth is usually faster to set up for this project because the repository already lives in GitHub and the app only needs one production OAuth provider to pass the production readiness check.

## GitHub OAuth App Values

Create a GitHub OAuth app with these values:

| GitHub field | Value |
|---|---|
| Application name | `ScholarScout` |
| Homepage URL | `https://YOUR_DOMAIN` |
| Authorization callback URL | `https://YOUR_DOMAIN/api/auth/callback/github` |

Use the real deployed Vercel URL in place of `https://YOUR_DOMAIN`.

GitHub OAuth apps use one callback URL. If you need separate preview and production callbacks, create separate OAuth apps.

## Values To Store

After creating the OAuth app, copy these values into Vercel environment variables and GitHub Actions secrets:

```text
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github
```

Leave these blank until Google is added:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

## Message To Send

```text
Hi, ScholarScout is launching with GitHub OAuth first.

Please create or grant access to a GitHub OAuth app with:
- Application name: ScholarScout
- Homepage URL: https://YOUR_DEPLOYED_DOMAIN
- Authorization callback URL: https://YOUR_DEPLOYED_DOMAIN/api/auth/callback/github

Please securely provide:
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET

Google OAuth will be added later, so GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET can remain blank for the first launch.
```

## Validation

After Vercel environment variables and GitHub Actions secrets are configured:

1. Redeploy ScholarScout.
2. Visit `${NEXTAUTH_URL}/api/auth/providers`.
3. Confirm the response includes `github`.
4. Sign in with a GitHub account whose email is included in `SCHOLARSCOUT_STAFF_EMAILS`.
5. Confirm `/profile` opens.
6. Confirm `/admin/programmes` opens for the staff account.
7. Run production smoke checks with:

```bash
SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github npm run smoke:production
```

## Add Google Later

When Google Workspace or Google Cloud access is ready, use [`google-oauth-permissions-handoff.md`](google-oauth-permissions-handoff.md), set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then change:

```text
SCHOLARSCOUT_SMOKE_EXPECTED_PROVIDERS=github,google
```
