# Phase 5 External API Coverage Matrix

This matrix records the Upstash capability surface used by the Phase 5 community-submission boundary. It covers the shared server-side reservation used before note and inbox writes; it does not expand the provider into a datastore, analytics, or browser capability.

| capability | decision | reason |
| --- | --- | --- |
| Upstash Redis REST: authenticated server-side connection | INTEGRATE | |
| Upstash Ratelimit: shared sliding reservation | INTEGRATE | |
| Upstash Ratelimit: fail-closed provider error handling before writes | INTEGRATE | |
| Upstash Ratelimit: fixed-window advisor credential and registration reservations | OPT-OUT | Existing non-community policies remain outside the Phase 5 release slice. |
| Upstash Ratelimit: token-bucket limits | OPT-OUT | The locked community policy is five submissions in a rolling hour. |
| Upstash Ratelimit: ephemeral client cache | OPT-OUT | The community limiter disables it so provider reservations remain authoritative. |
| Upstash Redis: general datastore reads or writes | OPT-OUT | Scholar Scout persistence stays behind the existing data-store boundary. |
| Upstash Redis: analytics or metrics APIs | OPT-OUT | Phase 5 sends no engagement or analytics data to Upstash. |
| Upstash Redis: browser-direct access | OPT-OUT | Credentials and quota authority remain server-only. |
