import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';
import { launchPersistentContext } from 'cloakbrowser';
import type { BrowserContext, Page, Response } from 'playwright';

// ─── Configuration ────────────────────────────────────────────────────────────

export const DOMAIN = process.env.SHOPEE_DOMAIN || 'shopee.co.id';
export const BASE_URL = `https://${DOMAIN}`;

export const PROFILE_DIR =
  process.env.SHOPEE_PROFILE_DIR || path.join(os.homedir(), '.shopee-mcp', 'chrome-profile');

// Shopee detects headless even with fingerprint patches, so we run HEADED by
// default (needs a display: WSLg, a desktop X server, or xvfb for servers).
// Set SHOPEE_HEADLESS=true only to experiment.
const HEADLESS = process.env.SHOPEE_HEADLESS === 'true';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function debug(msg: string): void {
  if (process.env.DEBUG === 'true') process.stderr.write(`[shopee-mcp] ${msg}\n`);
}

// ─── Context singleton ────────────────────────────────────────────────────────
//
// Shopee gates product data behind per-request anti-fraud signatures that only
// its own SDK, running in a non-detected browser, can mint. So we drive
// CloakBrowser (a fingerprint-patched Chromium) against a persistent profile the
// user logs into once (npm run login). We never hand-craft the signed request —
// instead we navigate to the relevant page and intercept the response Shopee's
// app fires (see captureJson).

let contextPromise: Promise<BrowserContext> | null = null;

async function createContext(headless: boolean): Promise<BrowserContext> {
  debug(`Launching CloakBrowser (headless=${headless}) with profile: ${PROFILE_DIR}`);
  const ctx = (await launchPersistentContext({
    userDataDir: PROFILE_DIR,
    headless,
    userAgent: USER_AGENT,
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    viewport: { width: 1366, height: 768 },
    humanize: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })) as unknown as BrowserContext;
  return ctx;
}

/**
 * Get the shared browser context, launching it on first use.
 * `headless` overrides the env default (the login flow forces a visible window).
 */
export async function getContext(headless: boolean = HEADLESS): Promise<BrowserContext> {
  if (!contextPromise) contextPromise = createContext(headless);
  return contextPromise;
}

/** The single reused page. */
async function getPage(): Promise<Page> {
  const ctx = await getContext();
  const existing = ctx.pages().find((p) => !p.isClosed());
  return existing ?? (await ctx.newPage());
}

// ─── Serialized navigation + interception ──────────────────────────────────────
//
// A single page is shared across tool calls; serialize access so overlapping
// calls don't clobber each other's navigation.

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
}

export interface CaptureOptions {
  /** Substring the target /api/v4 response URL must contain. */
  apiMatch: string;
  /** Max time to wait for the matching response (ms). */
  timeoutMs?: number;
}

/**
 * Navigate to `pageUrl` and return the JSON body of the first `/api/v4/*`
 * response whose URL contains `apiMatch` — i.e. the request Shopee's own app
 * fires (carrying the valid anti-fraud signature). Returns the raw parsed JSON;
 * callers inspect its `error` field.
 */
export async function captureJson<T>(pageUrl: string, opts: CaptureOptions): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 30000;
  return withLock(async () => {
    const page = await getPage();

    const matched = page.waitForResponse(
      (r: Response) => r.url().includes('/api/v4/') && r.url().includes(opts.apiMatch),
      { timeout: timeoutMs },
    );

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    const resp = await matched;
    const json = (await resp.json()) as T;
    return json;
  });
}

/** Warm the session once (loads Shopee so the anti-fraud SDK initialises). */
export async function warm(): Promise<void> {
  await withLock(async () => {
    const page = await getPage();
    if (!page.url().includes(DOMAIN)) {
      debug('Warming session on Shopee homepage…');
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3000);
    }
  });
}

/** Best-effort check that the saved profile is logged in. */
export async function isLoggedIn(): Promise<boolean> {
  const ctx = await getContext();
  const cookies = await ctx.cookies(BASE_URL);
  // Shopee sets SPC_U (user id) and SPC_EC (encrypted session) once authenticated.
  return cookies.some((c) => (c.name === 'SPC_U' || c.name === 'SPC_EC') && c.value.length > 4);
}

/** Cleanly close the browser (used on shutdown / after login). */
export async function closeContext(): Promise<void> {
  if (contextPromise) {
    const ctx = await contextPromise;
    await ctx.close();
    contextPromise = null;
  }
}
