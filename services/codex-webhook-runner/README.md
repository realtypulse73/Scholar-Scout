# Codex Webhook Runner

This service connects GitHub issues to Codex-ready execution packets.

## Purpose

The runner:

1. Receives GitHub webhook events.
2. Verifies webhook signatures.
3. Detects issues labeled `codex` or `automation`.
4. Builds a Codex job packet.
5. Posts the packet back into the issue.
6. Optionally forwards the packet to a Codex agent endpoint.

## Environment Variables

```text
PORT=8787
GITHUB_WEBHOOK_SECRET=replace-me
GITHUB_TOKEN=github-token
CODEX_AGENT_ENDPOINT=https://your-agent-endpoint.example.com
```

## Local Development

```bash
cd services/codex-webhook-runner
npm install
npm run dev
```

Health endpoint:

```text
GET /health
```

Webhook endpoint:

```text
POST /github/webhook
```

## GitHub Webhook Setup

In GitHub repository settings:

1. Open Webhooks.
2. Add webhook.
3. Payload URL:

```text
https://YOUR_DOMAIN/github/webhook
```

4. Content type:

```text
application/json
```

5. Secret:

Use the same value as `GITHUB_WEBHOOK_SECRET`.

6. Events:
- Issues
- Issue comments (optional)

## Trigger Pattern

Create an issue and add one of these labels:

- `codex`
- `automation`

The runner will:

- generate a feature branch name
- generate a Codex implementation packet
- comment the packet back into the issue
- optionally forward the packet to a configured agent endpoint

## Security Notes

GitHub webhook deliveries should be validated using the `X-Hub-Signature-256` header and HMAC-SHA256. GitHub recommends constant-time comparison to avoid timing attacks. citeturn876817search0turn876817search2

## Codex Integration Notes

OpenAI Codex currently exists across cloud, CLI, IDE, and app-server style surfaces. This runner intentionally separates:

- GitHub event orchestration
- Codex execution
- deployment

This makes it easier to swap execution providers later. citeturn876817search1turn876817search8
