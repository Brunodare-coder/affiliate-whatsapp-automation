/**
 * In-memory cache for WhatsApp bot performance optimization.
 *
 * Caches frequently-read, rarely-changed data (affiliate configs, bot settings,
 * monitored groups) to avoid repeated DB round-trips on every incoming message.
 *
 * TTL-based invalidation ensures data stays fresh without manual cache busting.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    this.cleanupInterval.unref(); // Don't prevent process exit
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { data: value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix (e.g., all keys for a userId) */
  invalidatePrefix(prefix: string): void {
    Array.from(this.store.keys()).forEach((key) => {
      if (key.startsWith(prefix)) this.store.delete(key);
    });
  }

  private cleanup(): void {
    const now = Date.now();
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) this.store.delete(key);
    });
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton cache instance shared across the server process
export const botCache = new MemoryCache();

// ── TTL constants ──────────────────────────────────────────────────────────
export const TTL = {
  /** Affiliate configs change rarely — cache for 5 minutes */
  AFFILIATE_CONFIG: 5 * 60 * 1000,
  /** Bot settings change rarely — cache for 5 minutes */
  BOT_SETTINGS: 5 * 60 * 1000,
  /** Monitored groups change occasionally — cache for 2 minutes */
  MONITORED_GROUPS: 2 * 60 * 1000,
  /** Automations change occasionally — cache for 2 minutes */
  AUTOMATIONS: 2 * 60 * 1000,
  /** Affiliate links change occasionally — cache for 3 minutes */
  AFFILIATE_LINKS: 3 * 60 * 1000,
  /** Feed global subscribers — cache for 2 minutes */
  FEED_SUBSCRIBERS: 2 * 60 * 1000,
};

// ── Cache key builders ─────────────────────────────────────────────────────
export const cacheKey = {
  mlConfig: (userId: number) => `ml_config:${userId}`,
  shopeeConfig: (userId: number) => `shopee_config:${userId}`,
  amazonConfig: (userId: number) => `amazon_config:${userId}`,
  magaluConfig: (userId: number) => `magalu_config:${userId}`,
  aliConfig: (userId: number) => `ali_config:${userId}`,
  botSettings: (userId: number) => `bot_settings:${userId}`,
  monitoredGroups: (userId: number, instanceId?: number) =>
    instanceId != null ? `monitored_groups:${userId}:${instanceId}` : `monitored_groups:${userId}`,
  automations: (userId: number) => `automations:${userId}`,
  affiliateLinks: (userId: number) => `affiliate_links:${userId}`,
  feedSubscribers: () => `feed_subscribers`,
  userPrefix: (userId: number) => `user:${userId}:`,
};

/**
 * Invalidate all cached data for a specific user.
 * Call this when user updates their configs, groups, or automations.
 */
export function invalidateUserCache(userId: number): void {
  botCache.delete(cacheKey.mlConfig(userId));
  botCache.delete(cacheKey.shopeeConfig(userId));
  botCache.delete(cacheKey.amazonConfig(userId));
  botCache.delete(cacheKey.magaluConfig(userId));
  botCache.delete(cacheKey.aliConfig(userId));
  botCache.delete(cacheKey.botSettings(userId));
  // Invalidate ALL monitored_groups keys for this user (with and without instanceId)
  // e.g. monitored_groups:1, monitored_groups:1:30001, monitored_groups:1:30002
  botCache.invalidatePrefix(`monitored_groups:${userId}`);
  // Invalidate ALL automations keys for this user
  botCache.invalidatePrefix(`automations:${userId}`);
  botCache.delete(cacheKey.affiliateLinks(userId));
  // Also invalidate feed subscribers since user's feed settings may have changed
  botCache.delete(cacheKey.feedSubscribers());
}
