# Codex Webhook Runner

This service receives selected Scholar Scout GitHub issue webhooks and forwards a bounded job packet to an authenticated agent endpoint.

## Required configuration

Set these server-only environment variables before accepting webhook deliveries:

```text
GITHUB_WEBHOOK_SECRET=replace-with-a-random-secret
SCHOLARSCOUT_GITHUB_REPOSITORY=scholar-scout/scholar-scout
CODEX_AGENT_ENDPOINT=https://your-agent-endpoint.example.com
CODEX_AGENT_BEARER_TOKEN=replace-with-agent-bearer-token
```

`GITHUB_REPOSITORY` is accepted as a compatibility fallback for the repository name, but `SCHOLARSCOUT_GITHUB_REPOSITORY` is the explicit deployment configuration. If the webhook secret is missing, `POST /github/webhook` returns `503`; it does not parse the delivery or make GitHub or agent calls. If the agent endpoint is configured without its bearer token, the runner accepts a qualifying webhook but does not dispatch it.

`GITHUB_TOKEN` is optional. When present, the runner posts its generated packet summary to the configured issue using that token. `PORT` defaults to `8787`.

## Delivery contract

- `GET /health` always returns `200` and does not require a webhook secret.
- `POST /github/webhook` validates the raw body against `X-Hub-Signature-256` with HMAC-SHA256 before JSON parsing. Missing or invalid signatures return a safe `503`.
- Only `issues` events for the configured repository qualify. The action must be `opened` or `labeled`, and the issue must have a `codex` or `automation` label.
- Rejected and ignored events do not post GitHub comments or dispatch agents.
- Incoming webhook bodies are capped at 64 KiB. Sanitized UTF-8 job packets are capped at 16 KiB.
- Agent dispatches require `CODEX_AGENT_BEARER_TOKEN`, send `Authorization: Bearer ...`, and use a 10-second abort timeout. Unauthenticated dispatch is not supported.

## Local development and tests

Use the repository's pinned Node 20/Corepack pnpm toolchain:

```bash
corepack enable
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @scholar-scout/codex-webhook-runner dev
```

Run the supported regression suite with:

```bash
corepack pnpm --filter @scholar-scout/codex-webhook-runner test
```

For changes that affect the repository release path, use the six protected-`main` checks and production evidence in the [production release runbook](../../docs/production-release-runbook.md#7-record-the-protected-release-evidence); a local webhook-runner command does not authorize a release.

## GitHub webhook setup

Configure a GitHub webhook for:

```text
https://YOUR_DOMAIN/github/webhook
```

Use `application/json`, set the same secret as `GITHUB_WEBHOOK_SECRET`, and subscribe to the **Issues** event. Creating or labeling an issue with `codex` or `automation` is the only supported trigger path.
