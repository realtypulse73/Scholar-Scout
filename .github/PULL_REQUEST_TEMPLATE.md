## Summary
Describe what changed and why.

## Related Issue
Closes #

## Testing
- [ ] Corepack and the frozen workspace install: `corepack enable` then `pnpm install --frozen-lockfile --ignore-scripts`
- [ ] ScholarScout / Web typecheck: `pnpm --filter @scholar-scout/web typecheck`
- [ ] ScholarScout / Web lint: `pnpm --filter @scholar-scout/web lint`
- [ ] ScholarScout / Web Jest: `pnpm --filter @scholar-scout/web test --runInBand`
- [ ] ScholarScout / Web build: `pnpm --filter @scholar-scout/web build`
- [ ] ScholarScout / HTTP data-service tests: `pnpm --filter @scholar-scout/http-data-service test`
- [ ] ScholarScout / Production-tooling tests: `pnpm test:production-tooling`

## Screenshots / Notes
Add screenshots or implementation notes when relevant.

## Safety Checklist
- [ ] No secrets committed
- [ ] Auth/role changes reviewed
- [ ] User-facing sponsored or monetized content is clearly labeled
- [ ] Dashboard predictions remain explainable
