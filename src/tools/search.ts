import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { shopeeCapture, shopeeUrl } from '../api/client.js';
import { BASE_URL } from '../browser/session.js';
import { cache } from '../utils/cache.js';
import { withErrorHandling } from '../utils/errors.js';
import type { SearchItemsResponse, ItemBasic } from '../api/types.js';

// Shopee stores prices as the real amount × 100000.
function formatPrice(raw: number, currency = 'IDR'): string {
  const amount = raw / 100000;
  if (currency === 'IDR') return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
  return `${currency} ${amount.toLocaleString('id-ID')}`;
}

function priceText(b: ItemBasic): string {
  if (b.price_min && b.price_max && b.price_min !== b.price_max) {
    return `${formatPrice(b.price_min, b.currency)} – ${formatPrice(b.price_max, b.currency)}`;
  }
  return formatPrice(b.price, b.currency);
}

// Sort option → Shopee search-URL params.
const SORT_MAP: Record<string, { sortBy: string; order?: string }> = {
  relevance: { sortBy: 'relevancy' },
  newest: { sortBy: 'ctime' },
  top_sales: { sortBy: 'sales' },
  price_low: { sortBy: 'price', order: 'asc' },
  price_high: { sortBy: 'price', order: 'desc' },
};

export function registerSearchTools(server: McpServer): void {
  server.tool(
    'search_products',
    'Search for products on Shopee by keyword, with sorting and pagination. ' +
      'Returns product names, prices, sold counts, ratings, seller location, product IDs, and direct URLs. ' +
      'Requires a one-time login (run `npm run login`) because Shopee blocks anonymous requests.',
    {
      query: z.string().min(1).describe('The search query, e.g. "laptop gaming", "sepatu nike"'),
      page: z.number().int().min(1).default(1).describe('Page number (default: 1)'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(60)
        .default(20)
        .describe('Max results to show from the page, 1-60 (default: 20)'),
      sort: z
        .enum(['relevance', 'newest', 'top_sales', 'price_low', 'price_high'])
        .default('relevance')
        .describe('Sort order (default: relevance)'),
    },
    async ({ query, page, limit, sort }) => {
      return withErrorHandling(async () => {
        const cacheKey = cache.key('search', query, page, limit, sort);
        const cached = cache.get<string>(cacheKey);
        if (cached) return { content: [{ type: 'text', text: cached }] };

        const { sortBy, order } = SORT_MAP[sort] ?? SORT_MAP.relevance;
        const qs = new URLSearchParams({ keyword: query, page: String(page - 1), sortBy });
        if (order) qs.set('order', order);
        const searchUrl = shopeeUrl(`/search?${qs.toString()}`);

        const data = await shopeeCapture<SearchItemsResponse>(searchUrl, 'search/search_items');

        const items = data.items ?? [];
        if (items.length === 0) {
          return {
            content: [
              { type: 'text', text: `No products found for "${query}". Try a different keyword.` },
            ],
          };
        }

        const shown = items.slice(0, limit);
        const totalCount = data.total_count ?? 0;
        const totalPages = totalCount > 0 ? Math.ceil(totalCount / items.length) : page;

        const lines: string[] = [
          `🛒 Search Results for "${query}"`,
          `📊 ${totalCount.toLocaleString('id-ID')} total products | Page ${page}${totalPages > 1 ? `/${totalPages}` : ''}`,
          ``,
        ];

        shown.forEach((it, i) => {
          const b = it.item_basic;
          const rank = (page - 1) * limit + i + 1;
          const rating = b.item_rating?.rating_star
            ? `⭐ ${b.item_rating.rating_star.toFixed(1)}`
            : '⭐ N/A';
          const sold = b.historical_sold || b.sold || 0;
          const soldText = sold > 0 ? ` | 📦 ${sold.toLocaleString('id-ID')} sold` : '';
          const official = b.is_official_shop ? ' [Shopee Mall]' : '';
          const url = `${BASE_URL}/product/${b.shopid}/${b.itemid}`;

          lines.push(`${rank}. **${b.name}**`);
          lines.push(`   💰 ${priceText(b)}`);
          lines.push(
            `   ${rating}${soldText} | 🏪 ${b.shop_location || 'N/A'}${official} | 🆔 ${b.itemid}`
          );
          lines.push(`   🔗 ${url}`);
          if (i < shown.length - 1) lines.push('');
        });

        if (!data.nomore) {
          lines.push(``, `📄 Use page=${page + 1} to see more results.`);
        }

        const text = lines.join('\n');
        cache.set(cacheKey, text);
        return { content: [{ type: 'text', text }] };
      });
    }
  );
}
