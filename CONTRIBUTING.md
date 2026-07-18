# Contributing to shopee-mcp

Thanks for helping improve this MCP server.

## Prerequisites

- [Node.js](https://nodejs.org/) **18+** (see `engines` in `package.json`)
- Git
- A display (or `xvfb`) — the server drives a **headed** browser.

## Getting started

```bash
git clone https://github.com/bintangtimurlangit/shopee-mcp.git
cd shopee-mcp
npm install
npm run build
npm run login   # one-time: log into Shopee in the CloakBrowser window
```

More detail: [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## Workflow

1. **Fork** the repository and create a **branch** from `main` (`feat/...`, `fix/...`, etc.).
2. Make focused changes; match existing **style**, **types**, and **patterns** in the codebase.
3. **Run checks** before opening a PR:

   ```bash
   npm run lint
   npm run format:check
   npm run typecheck
   npm run build
   npm test          # live smoke test (needs a login + a display)
   ```

4. **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(tools): ...`, `fix(browser): ...`, `docs: ...`). A `commit-msg` hook enforces this.
5. Open a **pull request** with a clear description of what changed and why.

## What to contribute

- Bug fixes with steps to reproduce when possible
- Documentation improvements (`README.md`, `docs/`)
- Features that fit the project's scope: **public** Shopee discovery via MCP — product search and detail. This is a read-only, discovery-only tool; seller/account features are intentionally out of scope.

## AI-assisted contributions

If a change was produced or heavily guided by an **AI coding agent or assistant**, disclose that in the PR description and **name the model** (e.g. _Claude Opus 4.8_, _GPT-5_).
