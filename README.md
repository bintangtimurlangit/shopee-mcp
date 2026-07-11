# shopee-mcp

An MCP server for **exploring Shopee** — product search and prices — from any MCP client (Claude Desktop, Claude Code, etc.). Discovery only: no seller features.

> Sibling of [`tokopedia-mcp`](https://github.com/bintangtimurlangit/tokopedia-mcp). Same goal, different plumbing — see [Why a browser?](#why-a-browser) below.

## Tools

| Tool | What it returns |
|------|-----------------|
| `search_products` | Keyword search with sorting & pagination — names, prices, sold counts, ratings, seller location, product IDs, URLs. |
| `get_product_detail` | One product — price & discount, brand, condition, category, rating, **review count**, **sold count**, stock, location, description. |

## Why a browser?

Unlike Tokopedia, Shopee does **not** expose an open API or server-rendered product HTML. Its `/api/v4/*` endpoints are guarded by an anti-fraud gate (`error 90309999`) that requires per-request signature headers (`af-ac-enc-dat`, `x-sap-sec`, …) minted by Shopee's own obfuscated SDK. Plain `fetch`, headless Chromium, and even a hand-rolled fetch from inside the page all get rejected.

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

| Variable | Default | Purpose |
|----------|---------|---------|
| `SHOPEE_DOMAIN` | `shopee.co.id` | Regional Shopee domain. |
| `SHOPEE_PROFILE_DIR` | `~/.shopee-mcp/chrome-profile` | Where the saved login lives. |
| `SHOPEE_HEADLESS` | `false` | Keep `false` — headless is detected. |
| `CACHE_TTL_MS` | `30000` | In-memory cache lifetime. |
| `DEBUG` | `false` | Log startup/debug info to stderr. |

## Development

```bash
npm run typecheck
npm test             # live smoke test (needs a display; use xvfb-run on servers)
npm run dev          # tsx watch
```

## Caveats

- **Login required.** No session → tools return a friendly "run `npm run login`" prompt.
- **Anti-bot is a moving target.** The free CloakBrowser binary can go stale as Shopee updates detection; CloakBrowser Pro ships newer patches.
- Respect Shopee's Terms of Service. This is for personal market exploration, not scraping at scale.

## License

MIT
