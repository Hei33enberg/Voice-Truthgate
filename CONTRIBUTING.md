# Contributing to Voice Truthgate

Thanks for your interest! Issues and pull requests are welcome.

## Where this code lives

Voice Truthgate is developed inside mosADD's main (private) monorepo and mirrored here
as the public, MIT-licensed distribution. That means:

- **This repo is the canonical home for the public packages.** PRs here are real —
  maintainers review them and fold accepted changes back upstream, then they flow
  out again on the next sync.
- If a change looks like it drifted (e.g. a version bump you didn't expect), that's
  the upstream sync. Open an issue if anything looks off.

## Ground rules

- By contributing to the MIT packages in `packages/*`, you agree your contribution is
  licensed under the MIT License.
- Keep the **honesty rails** intact. Voice Truthgate deliberately never surfaces a bare
  "REAL/FAKE" verdict — results are one of three confidence bands and always carry the
  "signal, not a verdict" disclaimer. PRs that weaken this (e.g. adding a boolean verdict,
  removing the disclaimer, or making accuracy claims) will be declined.
- No secrets, no internal infrastructure references, no hard-coded endpoints or keys in
  the published packages. The server detector is intentionally injectable.

## Developing

Requires Node 20+.

```bash
npm install          # install workspaces
npm run build        # tsup: build dist (ESM + CJS + .d.ts) for all packages — run this FIRST
npm run typecheck    # tsc --noEmit across all packages
npm test             # vitest across all packages
npm run example      # run the deterministic Node quick-check demo
# or all of the above in order:
npm run verify
```

- **Build first.** The packages publish a real `dist/` (ESM + CJS + type declarations via
  `tsup`), and cross-package imports resolve to `dist`, so `typecheck`, `test`, and `example`
  expect `npm run build` to have run. `npm run verify` does the whole sequence.
- Source lives in `src/`; add tests next to the code in `src/__tests__`. Please keep new
  behavior covered.

## Releasing (maintainers)

Versioning is managed by [changesets](./.changeset/README.md). Add a changeset with
`npm run changeset`. Releases are **deliberate**: bump with `npm run version-packages`, commit,
then run the **Release** GitHub Action manually. `npm publish` never runs automatically.

## Reporting bugs

Use the issue templates. If a **real** voice was flagged as synthetic (a false positive),
please use the dedicated template — those reports are especially useful for calibration.

Security issues: see [SECURITY.md](./SECURITY.md) — report privately, don't open an issue.
