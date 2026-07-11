#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerSearchTools } from './tools/search.js';
import { registerProductTools } from './tools/product.js';
import { closeContext } from './browser/session.js';

async function main() {
  const server = new McpServer({
    name: 'shopee-mcp',
    version: '0.1.0',
  });

  // Register tool groups. Every tool runs through the shared, logged-in browser
  // session (see src/browser/session.ts) — sign in once with `npm run login`.
  registerSearchTools(server);
  registerProductTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (process.env.DEBUG === 'true') {
    process.stderr.write('[shopee-mcp] Server started via stdio (browser-backed discovery)\n');
  }
}

// Tidy up the browser on shutdown.
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    void closeContext().finally(() => process.exit(0));
  });
}

main().catch((err) => {
  process.stderr.write(`[shopee-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
