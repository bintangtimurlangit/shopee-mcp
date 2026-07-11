import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { shopeeCapture, shopeeUrl } from '../api/client.js';
import { BASE_URL } from '../browser/session.js';
import { cache } from '../utils/cache.js';
import { withErrorHandling, truncate } from '../utils/errors.js';
import type { PdpResponse, PdpPriceValue } from '../api/types.js';

// Shopee stores prices as the real amount × 100000.
function fmt(raw: number, currency = 'IDR'): string {
  const amount = raw / 100000;
  if (currency === 'IDR') return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
  return `${currency} ${amount.toLocaleString('id-ID')}`;
}

function priceText(p: PdpPriceValue, currency: string): string {
  if (p.range_min >= 0 && p.range_max >= 0 && p.range_min !== p.range_max) {
    return `${fmt(p.range_min, currency)} – ${fmt(p.range_max, currency)}`;
  }
  return fmt(p.single_value, currency);
}

/** Parse "shopId/itemId" out of a Shopee product URL, if present. */
function parseProductUrl(url: string): { shopId: string; itemId: string } | null {
  // /product/<shopid>/<itemid>  OR  ...-i.<shopid>.<itemid>
  const m1 = url.match(/\/product\/(\d+)\/(\d+)/);
  if (m1) return { shopId: m1[1], itemId: m1[2] };
  const m2 = url.match(/-i\.(\d+)\.(\d+)/);
  if (m2) return { shopId: m2[1], itemId: m2[2] };
  return null;
}

export function registerProductTools(server: McpServer): void {
  server.tool(
    'get_product_detail',
    'Get details for a Shopee product: title, price (and discount), brand, condition, category, rating, stock, seller location, and description. ' +
      'Provide the numeric shopId + itemId (from search_products), or a full product URL.',
    {
      shopId: z.string().optional().describe('Numeric shop ID (from search_products URL / results)'),
      itemId: z.string().optional().describe('Numeric item/product ID (the 🆔 in search_products)'),
      url: z
        .string()
        .url()
        .optional()
        .describe('Full product URL, e.g. https://shopee.co.id/product/78730497/47060432055'),
    },
    async ({ shopId, itemId, url }) => {
      return withErrorHandling(async () => {
        let sid = shopId;
        let iid = itemId;
        if ((!sid || !iid) && url) {
          const parsed = parseProductUrl(url);
          if (parsed) {
            sid = parsed.shopId;
            iid = parsed.itemId;
          }
        }
        if (!sid || !iid) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Please provide both `shopId` and `itemId`, or a full product `url`.',
              },
            ],
          };
        }

        const cacheKey = cache.key('product', sid, iid);
        const cached = cache.get<string>(cacheKey);
        if (cached) return { content: [{ type: 'text', text: cached }] };

        const pageUrl = shopeeUrl(`/product/${sid}/${iid}`);
        const data = await shopeeCapture<PdpResponse>(pageUrl, 'pdp/get_pc');

        const item = data.data?.item;
        const pp = data.data?.product_price;
        if (!item || !pp) {
          return {
            content: [
              { type: 'text', text: '❌ Could not read product data. Check the shopId/itemId or URL.' },
            ],
          };
        }

        const currency = item.currency || 'IDR';
        const price = priceText(pp.price, currency);
        const before =
          pp.price_before_discount &&
          pp.price_before_discount.single_value > pp.price.single_value
            ? pp.price_before_discount
            : undefined;
        const discountPct = before
          ? Math.round((1 - pp.price.single_value / before.single_value) * 100)
          : 0;

        const review = data.data?.product_review;
        const conditionLabel = item.condition === 1 ? 'New' : item.condition ? 'Used' : 'Unknown';
        const rating = item.item_rating?.rating_star;
        const ratingCount = review?.total_rating_count ?? review?.cmt_count ?? 0;
        const soldText =
          review?.sold_count_display ?? review?.historical_sold_display ?? review?.global_sold_display;
        const breadcrumb = (item.categories ?? []).map((c) => c.display_name).join(' › ');
        const stock = item.stock ?? item.normal_stock ?? undefined;

        const lines: string[] = [
          `📦 **${item.title}**`,
          '',
          `💰 **Price:** ${price}${before ? ` ~~${priceText(before, currency)}~~ (-${discountPct}%)` : ''}`,
          '',
          `📊 **Stats:**`,
          `  ⭐ Rating: ${rating ? rating.toFixed(2) : 'N/A'}${ratingCount ? ` (${ratingCount.toLocaleString('id-ID')} reviews)` : ''}`,
          soldText ? `  ✅ Sold: ${soldText}` : '',
          '',
          `📋 **Details:**`,
          item.brand ? `  🏷 Brand: ${item.brand}` : '',
          `  🆕 Condition: ${conditionLabel}`,
          breadcrumb ? `  🗂 Category: ${breadcrumb}` : '',
          stock !== undefined && stock !== null ? `  📦 Stock: ${stock.toLocaleString('id-ID')}` : '',
          item.is_free_shipping ? `  🚚 Free shipping` : '',
          `  📍 Location: ${item.shop_location || 'N/A'}`,
          `  🆔 Item ID: \`${item.item_id}\` | Shop ID: \`${item.shop_id}\``,
        ].filter((l) => l !== '');

        if (item.description) {
          lines.push('', '📝 **Description:**', truncate(item.description.replace(/\n+/g, ' ').trim(), 400));
        }
        lines.push('', `🔗 ${BASE_URL}/product/${item.shop_id}/${item.item_id}`);

        const text = lines.join('\n');
        cache.set(cacheKey, text);
        return { content: [{ type: 'text', text }] };
      });
    }
  );
}
