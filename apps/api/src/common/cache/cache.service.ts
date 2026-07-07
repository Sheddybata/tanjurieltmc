import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Lightweight caching layer.
 *
 * Uses Redis when REDIS_URL is configured, and transparently falls back to a
 * per-instance in-memory cache when Redis is absent or unreachable. Callers
 * never need to care which backend is active — if caching fails for any reason
 * the app keeps working by recomputing values.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger('CacheService');
  private redis: Redis | null = null;
  private redisReady = false;
  private loggedError = false;
  private readonly memory = new Map<string, { value: string; expires: number }>();

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log('REDIS_URL not set — using in-memory cache fallback');
      return;
    }

    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 500, 5000),
      });
      this.redis.on('ready', () => {
        this.redisReady = true;
        this.loggedError = false;
        this.logger.log('Redis cache connected');
      });
      this.redis.on('error', (err) => {
        this.redisReady = false;
        if (!this.loggedError) {
          this.loggedError = true;
          this.logger.warn(`Redis unavailable, using in-memory cache: ${err.message}`);
        }
      });
      this.redis.on('end', () => {
        this.redisReady = false;
      });
    } catch (err) {
      this.redis = null;
      this.logger.warn(`Redis init failed, using in-memory cache: ${(err as Error).message}`);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.redis && this.redisReady) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : undefined;
      } catch {
        // fall back to memory below
      }
    }
    const entry = this.memory.get(key);
    if (entry && entry.expires > Date.now()) {
      return JSON.parse(entry.value) as T;
    }
    if (entry) this.memory.delete(key);
    return undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (this.redis && this.redisReady) {
      try {
        await this.redis.set(key, raw, 'EX', ttlSeconds);
        return;
      } catch {
        // fall back to memory below
      }
    }
    this.memory.set(key, { value: raw, expires: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.redis && this.redisReady) {
      try {
        await this.redis.del(key);
      } catch {
        // ignore — memory cleanup still runs below
      }
    }
    this.memory.delete(key);
  }

  /** Returns the cached value for `key`, or computes it with `producer`, caches it, and returns it. */
  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;
    const fresh = await producer();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}
