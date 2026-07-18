# Development

## Scripts

| Command             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `npm install`       | Install dependencies (also fetches the CloakBrowser binary) |
| `npm run login`     | One-time: open a browser window and log into Shopee         |
| `npm run build`     | Compile TypeScript to `build/` (`tsc`)                      |
| `npm run dev`       | Watch mode: `tsx watch src/index.ts`                        |
| `npm run start`     | Run compiled server: `node build/index.js`                  |
| `npm run lint`      | ESLint over the repo                                        |
| `npm run format`    | Prettier write; `npm run format:check` to verify            |
| `npm run typecheck` | `tsc --noEmit`, strict, with unused-symbol checks           |
| `npm test`          | **Live smoke test** — needs a login and a display           |

## Project layout

```
src/
  index.ts          # MCP server entry; registers tools
  login.ts          # one-time interactive login (npm run login)
  api/
    client.ts       # navigates the real page and intercepts the app's response
    types.ts        # shared types
  browser/
    session.ts      # CloakBrowser persistent-profile session
  tools/
    search.ts       # search_products
    product.ts      # get_product_detail
  utils/
    cache.ts        # in-memory TTL cache
    errors.ts       # error wrapper / friendly messages
test/
  smoke.ts          # the npm test health check
```

## Why a browser is required

Shopee does **not** expose an open API or server-rendered product HTML. Its `/api/v4/*` endpoints are guarded by an anti-fraud gate that requires per-request signature headers minted by Shopee's own obfuscated SDK. Plain `fetch`, headless Chromium, and hand-rolled in-page fetches are all rejected.

So this server drives **[CloakBrowser](https://github.com/CloakHQ/cloakbrowser)** (a fingerprint-patched Chromium) against a persistent profile you log into once, **navigates to the real Shopee page, and intercepts the response** its own app fetches — so the request carries valid signatures. The browser runs **headed** (Shopee detects headless); on a server use `xvfb`.

## Build output

`npm run build` emits JavaScript under **`build/`**. The repo **gitignores** `build/`; CI and `prepublishOnly` run `npm run build`.

## Tech stack

- TypeScript, **strict** (with `noUnusedLocals` / `noUnusedParameters`)
- Zod for MCP tool input validation
- `@modelcontextprotocol/sdk` (stdio), CloakBrowser + Playwright
