#!/usr/bin/env node
/**
 * One-time Shopee login.
 *
 * Opens a visible Chromium window bound to the persistent profile, lets you sign
 * in by hand (password, OTP, whatever Shopee asks), then saves the session so the
 * MCP server can reuse it. Run once; re-run only if the session expires.
 *
 *   npm run login        (dev)   or   shopee-mcp-login   (installed)
 */
import 'dotenv/config';
import readline from 'node:readline';
import { getContext, isLoggedIn, closeContext, BASE_URL, PROFILE_DIR } from './browser/session.js';

function prompt(question: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, () => { rl.close(); resolve(); }));
}

async function main() {
  console.log('\n🛒 Shopee MCP — login\n');
  console.log(`Profile directory: ${PROFILE_DIR}`);
  console.log('Opening a Chromium window…\n');

  // Force a visible window regardless of SHOPEE_HEADLESS.
  const ctx = await getContext(false);
  const page = ctx.pages().find((p) => !p.isClosed()) ?? (await ctx.newPage());

  await page.goto(`${BASE_URL}/buyer/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  if (await isLoggedIn()) {
    console.log('✅ This profile is already logged in. Nothing to do.\n');
    await closeContext();
    return;
  }

  console.log('👉 In the Chromium window: log into your Shopee account.');
  console.log('   Complete any OTP / captcha Shopee shows.');
  await prompt('\nWhen you see your account is logged in, press Enter here to save… ');

  const ok = await isLoggedIn();
  if (ok) {
    console.log('\n✅ Login detected and saved. You can close this and start the MCP server.\n');
  } else {
    console.log(
      '\n⚠️  Could not detect a logged-in session (no SPC_U/SPC_EC cookie).\n' +
        '   If you did log in, the session is still saved to the profile — try the server anyway.\n' +
        '   Otherwise re-run `npm run login`.\n'
    );
  }

  await closeContext();
}

main().catch(async (err) => {
  console.error('Login failed:', err);
  await closeContext().catch(() => {});
  process.exit(1);
});
