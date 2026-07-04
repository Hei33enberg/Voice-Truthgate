# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets) — it coordinates
versioning and changelogs across the four `@mosadd/*` packages.

## Adding a change

When you make a change worth releasing, run:

```bash
npm run changeset
```

Pick the affected packages and a semver bump (patch/minor/major), and write a one-line summary.
This creates a markdown file here that gets committed with your PR.

## Releasing (maintainers)

Releases are **deliberate**, not automatic (VoiceCheck must not publish an accuracy-bearing tool
before its benchmark). To cut a release:

1. `npm run version-packages` — applies pending changesets, bumps versions, updates changelogs.
2. Commit the version bump.
3. Trigger the **Release** workflow manually (Actions → Release → Run workflow). It builds and
   runs `changeset publish` with npm provenance. Requires the `NPM_TOKEN` repo secret.

`npm publish` never runs automatically on push — see `.github/workflows/release.yml`.
