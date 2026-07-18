# shopee-mcp

[![npm](https://img.shields.io/npm/v/@bintangtimurlangit/shopee-mcp?style=flat-square)](https://www.npmjs.com/package/@bintangtimurlangit/shopee-mcp)
[![license](https://img.shields.io/github/license/bintangtimurlangit/shopee-mcp?style=flat-square)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/bintangtimurlangit/shopee-mcp/ci.yml?branch=main&style=flat-square)](https://github.com/bintangtimurlangit/shopee-mcp/actions)
[![GitHub Repo](https://img.shields.io/badge/GitHub-shopee--mcp-24292f?style=flat-square&logo=github)](https://github.com/bintangtimurlangit/shopee-mcp)

An MCP server for **exploring Shopee** — product search and prices — from any MCP client (Claude Desktop, Claude Code, etc.). Discovery only: no seller features.

> **Login required, read-only.** Shopee blocks anonymous requests, so this **unofficial** server reads public data through your own logged-in browser session (see [Why a browser?](#why-a-browser)). It performs no seller or account actions.

**Full reference:** [Documentation](./docs/README.md) · **Changelog:** [CHANGELOG.md](./CHANGELOG.md) · **Versioning & releases:** [docs/RELEASES.md](./docs/RELEASES.md)

## Tools

| Tool                 | What it returns                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `search_products`    | Keyword search with sorting & pagination — names, prices, sold counts, ratings, seller location, product IDs, URLs.                 |
| `get_product_detail` | One product — price & discount, brand, condition, category, rating, **review count**, **sold count**, stock, location, description. |

### Tool annotations

Per the [MCP annotations spec](https://modelcontextprotocol.io/) — both tools are read-only, with no side effects.

| Tool                 | Read-only | Idempotent | Destructive |
| -------------------- | :-------: | :--------: | :---------: |
| `search_products`    |     ✓     |     ✓      |      –      |
| `get_product_detail` |     ✓     |     ✓      |      –      |

## Why a browser?

Shopee does **not** expose an open API or server-rendered product HTML. Its `/api/v4/*` endpoints are guarded by an anti-fraud gate (`error 90309999`) that requires per-request signature headers (`af-ac-enc-dat`, `x-sap-sec`, …) minted by Shopee's own obfuscated SDK. Plain `fetch`, headless Chromium, and even a hand-rolled fetch from inside the page all get rejected.

So this server:

1. Drives **[CloakBrowser](https://github.com/CloakHQ/cloakbrowser)** — a Chromium with binary-level fingerprint patches — against a **persistent profile you log into once**.
2. **Navigates to the real Shopee page and intercepts the response** its own app fetches, so the request carries valid signatures.

The browser must run **headed** (Shopee detects headless); on a server use a virtual display (`xvfb`).

## Setup

```bash
npm install          # also downloads the CloakBrowser binary (~200 MB, cached)
npm run build
```

### 1. Log in once

Shopee blocks anonymous requests, so you sign in one time. This saves a session to `~/.shopee-mcp/chrome-profile`.

```bash
npm run login        # opens a CloakBrowser window — log in, then press Enter
```

- On a desktop / WSLg, the window appears normally.
- Re-run only when the session expires.

### 2. Register with your MCP client

The server launches a **headed** browser, so it needs a display. On a headless machine, wrap it with `xvfb-run`.

Claude Desktop / Claude Code `mcpServers` entry:

```json
{
  "mcpServers": {
    "shopee": {
      "command": "xvfb-run",
      "args": ["-a", "node", "/absolute/path/to/shopee-mcp/build/index.js"]
    }
  }
}
```

On a machine with a real display you can drop `xvfb-run` and use `"command": "node"`, `"args": ["…/build/index.js"]` (a browser window will pop up per session).

## Configuration

All optional — see `.env.example`. Copy to `.env` to override.

| Variable             | Default                        | Purpose                              |
| -------------------- | ------------------------------ | ------------------------------------ |
| `SHOPEE_DOMAIN`      | `shopee.co.id`                 | Regional Shopee domain.              |
| `SHOPEE_PROFILE_DIR` | `~/.shopee-mcp/chrome-profile` | Where the saved login lives.         |
| `SHOPEE_HEADLESS`    | `false`                        | Keep `false` — headless is detected. |
| `CACHE_TTL_MS`       | `30000`                        | In-memory cache lifetime.            |
| `DEBUG`              | `false`                        | Log startup/debug info to stderr.    |

## Development

```bash
npm run lint         # eslint
npm run format       # prettier --write (format:check to verify)
npm run typecheck
npm test             # live smoke test (needs a display; use xvfb-run on servers)
npm run dev          # tsx watch
```

More detail: **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)**.

## Troubleshooting

| Symptom                                       | Likely cause / fix                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `🔒 Not signed in` / anonymous-request errors | No/expired session → run `npm run login`.                                                                               |
| `error 90309999` or empty results             | Shopee's anti-bot gate rejected the request. Ensure you're logged in and running **headed** (or via `xvfb-run`); retry. |
| A read returns empty for a valid product      | Shopee lazy-loads; retry, and run with `DEBUG=true` to inspect.                                                         |
| Empty or stale results right after a change   | In-memory cache — lower `CACHE_TTL_MS` or wait for the TTL to expire.                                                   |
| Headless / server has no display              | Wrap the command in `xvfb-run -a …`.                                                                                    |

## Caveats

- **Login required.** No session → tools return a friendly "run `npm run login`" prompt.
- **Anti-bot is a moving target.** The free CloakBrowser binary can go stale as Shopee updates detection; CloakBrowser Pro ships newer patches.
- Respect Shopee's Terms of Service. This is for personal market exploration, not scraping at scale.

## Contributing & security

[CONTRIBUTING.md](./CONTRIBUTING.md) · [SECURITY.md](./SECURITY.md) · [Code of Conduct](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)

---

## Disclaimer

This is an **unofficial** project. It is **not affiliated with, authorized, maintained, sponsored, or endorsed by Shopee or Sea Limited**.

It works by driving a real logged-in browser session against Shopee's web app, which can change without notice — a tool may break when Shopee updates its site or anti-bot behavior. It reads only publicly available product data and performs no account actions.

You are responsible for using this software in compliance with [Shopee's Terms of Service](https://shopee.co.id/docs/terms) and applicable law. Use reasonable request volumes. All product names, logos, and brands are property of their respective owners.
