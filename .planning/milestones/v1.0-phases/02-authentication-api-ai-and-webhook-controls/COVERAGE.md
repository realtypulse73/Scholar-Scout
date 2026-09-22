# Phase 2 External API Coverage Matrix

This matrix records the complete external-API surface intentionally considered for Phase 2. It is limited to the provider capabilities used to enforce the phase's advisor, rate-limit, webhook dispatch, and sign-in controls.

| capability | decision | reason |
| --- | --- | --- |
| OpenAI Responses API: structured advisor response creation | INTEGRATE | |
| OpenAI Responses API: streaming response events | OPT-OUT | The advisor is a direct single-turn request with a bounded JSON response. |
| OpenAI Responses API: persisted response storage | OPT-OUT | Phase 2 does not retain provider conversation state. |
| OpenAI Responses API: response retrieval | OPT-OUT | The server validates the immediate response only. |
| OpenAI Responses API: response cancellation | OPT-OUT | A server-owned ten-second timeout bounds the single request without a follow-up provider control. |
| OpenAI Responses API: continuation from a previous response | OPT-OUT | The advisor has no browser-supplied or provider-managed history. |
| OpenAI Responses API: Conversations resources | OPT-OUT | D-09 through D-12 require a stateless server-owned single-turn advisor. |
| OpenAI Responses API: background mode | OPT-OUT | Deferred or asynchronous advisor jobs are outside the Phase 2 boundary. |
| OpenAI Responses API: web search tool | OPT-OUT | The advisor must not browse or introduce mutable external facts. |
| OpenAI Responses API: file search tool | OPT-OUT | The advisor receives only bounded server-selected context. |
| OpenAI Responses API: code interpreter tool | OPT-OUT | Phase 2 provides guidance only and does not execute student or server code. |
| OpenAI Responses API: computer use tool | OPT-OUT | The advisor has no authority to operate external systems. |
| OpenAI Responses API: image generation tool | OPT-OUT | Non-advisor multimodal generation is outside the control scope. |
| OpenAI Responses API: remote MCP tool | OPT-OUT | D-09 through D-12 prohibit tools and external browsing. |
| OpenAI Responses API: function calling | OPT-OUT | The direct advisor route does not delegate actions to application functions. |
| OpenAI Responses API: non-advisor multimodal generation | OPT-OUT | Phase 2 retains a text-only student guidance interaction. |
| Upstash Ratelimit: fixed-window atomic reservation for advisor quotas | INTEGRATE | |
| Upstash Ratelimit: fixed-window atomic reservation for credential attempts | INTEGRATE | |
| Upstash Ratelimit: fixed-window atomic reservation for registrations | INTEGRATE | |
| Upstash Ratelimit: sliding-window limits | OPT-OUT | Phase 2 policy uses fixed reservation windows with explicit reset metadata. |
| Upstash Ratelimit: token-bucket limits | OPT-OUT | The locked policies use fixed counts rather than refill-based throughput. |
| Upstash Redis: cache operations | OPT-OUT | The provider is used only for fail-closed rate-limit reservations. |
| Upstash Redis: analytics operations | OPT-OUT | Phase 2 does not send analytics data to the rate-limit provider. |
| Upstash Redis: general data-store operations | OPT-OUT | Programme and student persistence remain behind the existing data-store boundary. |
| GitHub Webhooks: signed issues delivery for the configured repository | INTEGRATE | |
| GitHub Issues webhook: opened action with an approved codex or automation label | INTEGRATE | |
| GitHub Issues webhook: labeled action with an approved codex or automation label | INTEGRATE | |
| GitHub Issues API: qualified job-packet comment posting | INTEGRATE | |
| GitHub Webhooks: every non-issues event | OPT-OUT | D-14 accepts only configured repository issues events. |
| GitHub Issues webhook: unapproved actions or labels | OPT-OUT | Only opened or labeled events bearing approved labels may dispatch. |
| GitHub Webhooks: webhook administration | OPT-OUT | Phase 2 consumes deliveries and does not create or manage webhook configuration. |
| GitHub Issues API: issue mutation other than the qualified job-packet comment | OPT-OUT | The runner does not alter issue state or content beyond its configured comment. |
| GitHub Webhooks: unverified delivery processing | OPT-OUT | D-13 requires a valid raw-body signature before parsing or side effects. |
| Codex agent endpoint: bearer-authenticated bounded job-packet POST dispatch | INTEGRATE | |
| Codex agent endpoint: unauthenticated dispatch | OPT-OUT | D-15 requires a configured bearer token before any dispatch. |
| Codex agent endpoint: inbound callbacks | OPT-OUT | The runner supports only one-way outbound delivery. |
| Codex agent endpoint: polling | OPT-OUT | The runner does not retrieve agent status or results. |
| Codex agent endpoint: retry orchestration | OPT-OUT | The contract is a single ten-second bounded dispatch without queueing. |
| Codex agent endpoint: unbounded or bidirectional job control | OPT-OUT | D-16 constrains packets and timeout to a one-way dispatch contract. |
| GitHub OAuth: authorization-code sign-in and callback identity | INTEGRATE | |
| GitHub OAuth: provider-management APIs | OPT-OUT | NextAuth uses GitHub only to establish a Scholar Scout session. |
| GitHub OAuth: refresh-token or background access | OPT-OUT | Phase 2 does not retain provider access for offline work. |
| GitHub OAuth: organization or repository data access | OPT-OUT | OAuth sign-in does not grant Scholar Scout GitHub data access. |
| GitHub OAuth: additional profile scopes | OPT-OUT | The existing optional provider uses only the identity needed to create a session. |
| Google OAuth: authorization-code sign-in and callback identity | INTEGRATE | |
| Google OAuth: provider-management APIs | OPT-OUT | NextAuth uses Google only to establish a Scholar Scout session. |
| Google OAuth: refresh-token or background access | OPT-OUT | Phase 2 does not retain provider access for offline work. |
| Google OAuth: Google account or application data access | OPT-OUT | OAuth sign-in does not read Google data beyond returned identity. |
| Google OAuth: additional profile scopes | OPT-OUT | The existing optional provider uses only the identity needed to create a session. |
