# Contributing to VoiceCheck

Thanks for your interest! Issues and pull requests are welcome.

## Where this code lives

VoiceCheck is developed inside mosADD's main (private) monorepo and mirrored here
as the public, MIT-licensed distribution. That means:

- **This repo is the canonical home for the public packages.** PRs here are real —
  maintainers review them and fold accepted changes back upstream, then they flow
  out again on the next sync.
- If a change looks like it drifted (e.g. a version bump you didn't expect), that's
  the upstream sync. Open an issue if anything looks off.

## Ground rules

- By contributing to the MIT packages in `packages/*`, you agree your contribution is
  licensed under the MIT License.
- Keep the **honesty rails** intact. VoiceCheck deliberately never surfaces a bare
  "REAL/FAKE" verdict — results are one of three confidence bands and always carry the
  "signal, not a verdict" disclaimer. PRs that weaken this (e.g. adding a boolean verdict,
  removing the disclaimer, or making accuracy claims) will be declined.
- No secrets, no internal infrastructure references, no hard-coded endpoints or keys in
  the published packages. The server detector is intentionally injectable.

## Developing

Requires Node 20+.

```bash
npm install          # install workspaces
npm run typecheck    # tsc --noEmit across all packages
npm test             # vitest across all packages
npm run example      # run the deterministic Node quick-check demo
```

- Packages ship raw TypeScript from `src/` (no build step yet) — imports resolve to
  `src/index.ts`.
- Add tests next to the code in `src/__tests__`. Please keep new behavior covered.

## Reporting bugs

Use the issue templates. If a **real** voice was flagged as synthetic (a false positive),
please use the dedicated template — those reports are especially useful for calibration.

Security issues: see [SECURITY.md](./SECURITY.md) — report privately, don't open an issue.
