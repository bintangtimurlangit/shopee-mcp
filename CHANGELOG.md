# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0/). For **how** we version, tag, and publish, see [docs/RELEASES.md](./docs/RELEASES.md).

## [Unreleased]

## [0.1.1] - 2026-07-21

### Added

- Standardized project scaffolding: `LICENSE` (MIT), `.editorconfig`, ESLint + Prettier, Conventional Commits (commitlint), Husky pre-commit hooks, CI + release workflows, issue/PR templates, and a `docs/` guide set.

### Changed

- Updated runtime and development dependencies, and standardized the npm trusted-publishing release workflow.

## [0.1.0] - 2026-07-12

### Added

- Initial release: MCP server for **exploring Shopee** over stdio, driving a logged-in CloakBrowser session to clear Shopee's anti-bot gate.
- **2 tools:** `search_products` (keyword search with sorting & pagination) and `get_product_detail` (price, discount, brand, condition, rating, review/sold counts, stock, location, description).
- In-memory read cache and a persistent browser profile under `~/.shopee-mcp/`.

[Unreleased]: https://github.com/bintangtimurlangit/shopee-mcp/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/bintangtimurlangit/shopee-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/bintangtimurlangit/shopee-mcp/releases/tag/v0.1.0
