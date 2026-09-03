---
status: resolved
trigger: "GitHub CLI reports an invalid active token after browser authentication appears to complete."
created: 2026-07-26T00:00:00-04:00
updated: 2026-07-26T00:24:50-04:00
---

## Symptoms

- expected: "`gh auth status` should report an authenticated GitHub.com account after the browser login flow."
- actual: "GitHub CLI 2.96.0 reports the active `realtypulse73` token is invalid from both the legacy hosts.yml path and the default credential entry."
- errors: "Failed to log in to github.com account realtypulse73; the token is invalid."
- timeline: "The invalid token existed before the newly installed CLI; the user completed at least the protocol selection in a new browser login flow, but status still reports invalid."
- reproduction: "Run `gh auth status` in the project PowerShell terminal."

## Current Focus

reasoning_checkpoint:
  hypothesis: "The GitHub CLI's stored default credential for `realtypulse73` is invalid; `gh auth status` reads that credential and rejects it before any repository-level authorization is considered."
  confirming_evidence:
    - "Running the installed `C:\\Program Files\\GitHub CLI\\gh.exe` directly reports version 2.96.0 and reproduces: `The token in default is invalid.`"
    - "No process-level `GH_` or `GITHUB_` credential override variable names are present, and only credential-store metadata was inspected."
  falsification_test: "After an interactive re-authentication, direct `gh auth status --hostname github.com` would still report the default token invalid."
  fix_rationale: "`gh auth login -h github.com --web` replaces the invalid default credential through GitHub CLI's supported browser flow; no token must be exposed or manually edited."
  blind_spots: "This sandbox cannot complete the browser login or make the GitHub API identity request because outbound socket access is denied."
hypothesis: "Confirmed: the previously stored default GitHub.com credential was invalid."
test: "User completed the supported browser re-authentication flow and reran direct GitHub.com status verification."
expecting: "Status reports an authenticated `realtypulse73` GitHub.com account without an invalid-token message."
next_action: "None — session resolved."

## Evidence

- timestamp: 2026-07-26T00:00:00-04:00
  observation: "GitHub CLI 2.96.0 is installed; `gh auth status` rejects the active account token."
- timestamp: 2026-07-26T00:00:00-04:00
  observation: "The connected GitHub app reports admin permissions for realtypulse73/Scholar-Scout, so repository authorization is available through a separate connector."
- timestamp: 2026-07-26T00:05:00-04:00
  observation: "The project has no discovered local agent skill directories, and Node.js is not currently resolvable on PATH for the optional GSD agent-skill query."
- timestamp: 2026-07-26T00:08:00-04:00
  observation: "In this project PowerShell process, `Get-Command gh`, `gh --version`, `gh auth status`, and `gh api user` all fail because `gh` is not on PATH; the only observed CLI metadata is a `GitHub CLI` config directory with `config.yml` and a recently updated `hosts.yml` (contents not read)."
- timestamp: 2026-07-26T00:11:00-04:00
  observation: "`C:\\Program Files\\GitHub CLI\\gh.exe` exists, but neither `where.exe gh` nor PATH resolution finds it. No process-level `GH_` or `GITHUB_` credential override variable names are present."
- timestamp: 2026-07-26T00:14:00-04:00
  observation: "Running the discovered executable directly confirms GitHub CLI 2.96.0 and reproduces `The token in default is invalid` for active account `realtypulse73`. The non-secret identity request could not run because this sandbox forbids its outbound socket connection."
- timestamp: 2026-07-26T00:24:50-04:00
  observation: "After the user completed `gh auth login --web`, direct `gh auth status -h github.com` reports `realtypulse73` logged in through the keyring with repository and workflow scopes; no invalid-token error remains."

## Eliminated

- hypothesis: "The token failure was caused only by the missing `gh` PATH entry in this project process."
  evidence: "Calling the installed executable by its explicit path reproduces the exact invalid-default-token error."
  timestamp: 2026-07-26T00:14:00-04:00

## Resolution

root_cause: "GitHub CLI 2.96.0 reads its stored default GitHub.com credential for active account `realtypulse73`, and the CLI directly reports that credential as invalid. No `GH_` or `GITHUB_` process override was present."
fix: "Completed supported browser re-authentication with `gh auth login --web`; GitHub CLI replaced the invalid stored credential through its keyring-backed flow."
verification: "User verified direct `gh auth status -h github.com` now reports authenticated `realtypulse73` access with repository and workflow scopes."
files_changed: []
