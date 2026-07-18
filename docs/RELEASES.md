# Releases and versioning

This project uses **Semantic Versioning** ([SemVer 2.0](https://semver.org/)) for the **npm package**. The canonical version string is **`package.json`** → `version`.

Commit messages follow **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** (`feat:`, `fix:`, `docs:`, `chore:`, …). That pairs with SemVer: `fix` → PATCH, `feat` → MINOR, breaking changes → MAJOR.

## Version format

`MAJOR.MINOR.PATCH` — e.g. `0.1.0`, `1.2.3`.

- **MAJOR** — Breaking changes (removed/renamed tools, incompatible env or behavior).
- **MINOR** — Backward-compatible features (new tools, new optional config).
- **PATCH** — Bug fixes and safe corrections that do not change the public contract.

## npm dist-tags

| Tag      | Typical use                                                          |
| -------- | -------------------------------------------------------------------- |
| `latest` | Default stable install: `npm install @bintangtimurlangit/shopee-mcp` |
| `beta`   | Optional prereleases: `npm publish --tag beta` with `X.Y.Z-beta.N`   |

Scoped packages use **`"publishConfig": { "access": "public" }`**.

## Publishing (maintainers)

Releases are **automated** by the [`release` workflow](../.github/workflows/release.yml): pushing a `vX.Y.Z` tag runs typecheck + build and publishes to npm (with [provenance](https://docs.npmjs.com/generating-provenance-statements)), then creates a GitHub release.

**One-time setup:** add an npm **automation token** as the repo secret **`NPM_TOKEN`**. Without it, the workflow still builds but skips publish.

**To cut a release:**

1. Bump **`version`** in **`package.json`** per SemVer.
2. Update **`CHANGELOG.md`**: move items from **`[Unreleased]`** into **`[X.Y.Z] - YYYY-MM-DD`**.
3. Commit with Conventional Commits, e.g. `chore(release): v0.1.1`.
4. Tag and push:

   ```bash
   git tag v0.1.1
   git push origin main --tags
   ```

5. The workflow publishes to npm and opens the GitHub release.

## Git tags

Tag stable releases as **`vX.Y.Z`**; prereleases **`vX.Y.Z-beta.N`**.
