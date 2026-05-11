# Google OAuth Permissions Handoff

Use this note to request the Google Cloud access needed to enable Google sign-in for ScholarScout.

## Access To Request

Ask the Google Cloud project owner or Google Workspace administrator for one of these paths:

| Path | What to request |
|---|---|
| Direct access | Add the deployment owner to the Google Cloud project with permission to manage OAuth consent and OAuth clients. |
| Admin-assisted setup | Have the admin create the OAuth client and securely provide the client ID and client secret. |

For least-privilege access, request these Google Cloud roles when available:

| Area | Role |
|---|---|
| OAuth client credentials | `roles/iam.oauthClientAdmin` |
| OAuth consent / brand configuration | `roles/oauthconfig.editor` |
| Basic project visibility | Viewer, or equivalent project read access |

If the organization does not allow those granular roles, the admin can either use a temporary project role with equivalent permissions or complete the setup on your behalf.

## ScholarScout Google OAuth Values

| Google field | ScholarScout value |
|---|---|
| Application type | Web application |
| Authorized redirect URI | `https://YOUR_DOMAIN/api/auth/callback/google` |
| Client ID | `GOOGLE_CLIENT_ID` |
| Client secret | `GOOGLE_CLIENT_SECRET` |

Use the real deployed Vercel URL in place of `https://YOUR_DOMAIN`.

## Message To Send

```text
Hi, I need Google Cloud access to enable Google sign-in for ScholarScout.

Please either:
1. Add me to the Google Cloud project with permission to manage OAuth consent configuration and OAuth client credentials, preferably using roles/iam.oauthClientAdmin plus roles/oauthconfig.editor and basic project viewer access; or
2. Create the OAuth client for me and securely provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.

The OAuth client should be a Web application.

Authorized redirect URI:
https://YOUR_DEPLOYED_DOMAIN/api/auth/callback/google

The credentials will be stored only in Vercel environment variables and GitHub Actions secrets, not committed to GitHub.
```

## Admin-Assisted Setup Checklist

If an admin creates the credentials:

1. Open the Google Cloud project that owns ScholarScout authentication.
2. Configure the OAuth consent screen or app brand as required by the organization.
3. Create an OAuth client with application type `Web application`.
4. Add the authorized redirect URI: `https://YOUR_DOMAIN/api/auth/callback/google`.
5. Copy the client ID and client secret through the organization's approved secure channel.
6. Add the values to Vercel environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Add the same values to GitHub Actions repository secrets if the readiness workflow should validate Google OAuth.
8. Redeploy ScholarScout and run the production readiness check.

## Validation After Credentials Are Added

Run:

```bash
npm run check:production-env -- --env-file .env.production.local
```

Then validate the deployed app:

1. Visit `${NEXTAUTH_URL}/api/auth/providers`.
2. Confirm the response includes `google`.
3. Sign in with a staff-allowlisted Google email.
4. Confirm `/profile` opens.
5. Confirm `/admin/programmes` opens for the staff account.
