# Security

## Supported versions

Security fixes are applied to the **latest release** on the default branch when practical.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for undisclosed security problems.

1. Use [GitHub private vulnerability reporting](https://github.com/bintangtimurlangit/shopee-mcp/security/advisories/new) if it is enabled for this repository, **or**
2. Contact the maintainers via a private channel (e.g. email on your GitHub profile).

Include:

- A short description of the issue and its impact
- Steps to reproduce (or a proof-of-concept), if safe to share
- Affected versions or dependency versions, if known

We aim to acknowledge reports within a few days and coordinate disclosure after a fix is available.

## Scope and credential handling

This is a **local MCP server** that reads **public** Shopee product data through a **logged-in browser session** (Shopee blocks anonymous requests). Be aware:

- Your **session lives on your machine** under `~/.shopee-mcp/chrome-profile` (configurable via `SHOPEE_PROFILE_DIR`). Treat that directory like a password. It is never transmitted anywhere by this server, and the repo **gitignores** local profile/state.
- The server is **read-only** — it performs product search and detail lookups only; there are no seller or account actions.

Issues in **Shopee's services**, **CloakBrowser**, or **upstream** dependencies (e.g. `@modelcontextprotocol/sdk`, `playwright`) should be reported to those projects when appropriate.
