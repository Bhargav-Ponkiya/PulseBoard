import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly publisher: Redis;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('REDIS_URL');
    this.redis = new Redis(url);
    this.publisher = new Redis(url);
  }

  /** Retrieves a JSON-parsed value from Redis by key, or null if not found. */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /** Stores a serialized value in Redis with an optional TTL. */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl !== undefined) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  /** Deletes a key from Redis. */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** Increments a Redis counter and sets expiry on first increment. */
  async incr(key: string, ttl: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, ttl);
    }
    return count;
  }

  /** Publishes a serialized message to a Redis channel. */
  async publish(channel: string, payload: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    await this.publisher.quit();
  }
}
