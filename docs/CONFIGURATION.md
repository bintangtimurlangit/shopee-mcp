# Configuration

For installing the package or cloning the repo, see **[Installation](../README.md#installation)** in the README.

> **Login required.** Shopee blocks anonymous requests, so this server reads public data through a saved browser session. Run `npm run login` once before use. There are no API keys — authentication is the browser session under `~/.shopee-mcp/chrome-profile`.

---

## Environment variables

All optional. Set them in your MCP client's **`env`** block, or copy `.env.example` to `.env` when developing from a checkout.

| Variable             | Default                        | Description                          |
| -------------------- | ------------------------------ | ------------------------------------ |
| `SHOPEE_DOMAIN`      | `shopee.co.id`                 | Regional Shopee domain.              |
| `SHOPEE_PROFILE_DIR` | `~/.shopee-mcp/chrome-profile` | Where the saved login lives.         |
| `SHOPEE_HEADLESS`    | `false`                        | Keep `false` — headless is detected. |
| `CACHE_TTL_MS`       | `30000`                        | In-memory cache lifetime.            |
| `DEBUG`              | `false`                        | Log startup/debug info to stderr.    |

---

## MCP configuration (all clients)

This server uses **stdio** and launches a **headed** browser, so it needs a display. On a headless machine, wrap the command in `xvfb-run`.

### With a virtual display (servers)

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

### With a real display (desktop / WSLg)

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["/absolute/path/to/shopee-mcp/build/index.js"]
    }
  }
}
```

Use an **absolute** path to `build/index.js`.

---

## Claude Code

- **CLI:** `claude mcp add shopee -- xvfb-run -a node /absolute/path/to/shopee-mcp/build/index.js` (drop `xvfb-run -a` on a machine with a display).
- **Project scope:** `.mcp.json` in the repo root. **User scope:** `~/.claude.json`.
- **Restart** or reload so the new server is registered.

## Claude Desktop

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Use the same **`mcpServers`** JSON as above.

## Other editors

Cursor, Zed, Windsurf, and any other **stdio MCP host** use the same pattern: a server whose command is `node` (or `xvfb-run … node`) plus the path to `build/index.js`.
