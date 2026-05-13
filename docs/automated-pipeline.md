ScholarScout Automated Pipeline

ChatGPT defines features.
GitHub stores issues and code.
Codex builds features.
CI validates.
Vercel deploys.

Rules:
- Use PRs only
- Run typecheck, lint, tests
- No secrets committed

Flow:
ChatGPT -> Issue -> Codex -> PR -> CI -> Merge -> Deploy
