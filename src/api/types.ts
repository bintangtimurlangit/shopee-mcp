// ─── Search Types ─────────────────────────────────────────────────────────────
// Shape of Shopee's /api/v4/search/search_items response (subset we use).

export interface ItemRating {
  rating_star: number;
  rating_count: number[];
}

export interface ItemBasic {
  itemid: number;
  shopid: number;
  name: string;
  /** Price in the currency's smallest unit × 100000 (divide by 100000 for IDR). */
  price: number;
  price_min: number;
  price_max: number;
  price_before_discount: number;
  currency: string;
  stock: number;
  sold: number;
  historical_sold: number;
  liked_count: number;
  discount?: string;
  item_rating: ItemRating;
  shop_location: string;
  is_official_shop: boolean;
  shopee_verified: boolean;
  image: string;
}

export interface SearchItem {
  itemid: number;
  shopid: number;
  item_basic: ItemBasic;
}

export interface SearchItemsResponse {
  error?: number;
  total_count: number;
  nomore: boolean;
  items: SearchItem[] | null;
}

// ─── Product Detail Types ───────────────────────────────────────────────────
// Subset of /api/v4/pdp/get_pc → data.

export interface PdpCategory {
  display_name: string;
}

export interface PdpItem {
  item_id: number;
  shop_id: number;
  title: string;
  brand?: string;
  /** 1 = new, otherwise used. */
  condition?: number;
  currency?: string;
  item_rating?: { rating_star: number; rating_count: number[] };
  shop_location?: string;
  categories?: PdpCategory[];
  description?: string;
  image?: string;
  stock?: number | null;
  normal_stock?: number | null;
  historical_sold?: number;
  global_sold_count?: number;
  is_free_shipping?: boolean;
  is_official_shop?: boolean;
}

/** A price value: prices are the real amount × 100000. range_* are -1 when single. */
export interface PdpPriceValue {
  single_value: number;
  range_min: number;
  range_max: number;
}

export interface PdpProductPrice {
  discount?: number;
  price: PdpPriceValue;
  price_before_discount?: PdpPriceValue;
}

/** /api/v4/pdp/get_pc → data.product_review — where the sold/review counts live. */
export interface PdpProductReview {
  total_rating_count?: number;
  cmt_count?: number;
  /** Human-formatted sold counts, e.g. "355", "1,2rb". */
  sold_count_display?: string;
  historical_sold_display?: string;
  global_sold_display?: string;
}

export interface PdpResponse {
  error?: number;
  error_msg?: string;
  data?: {
    item: PdpItem;
    product_price: PdpProductPrice;
    product_review?: PdpProductReview;
  };
}
