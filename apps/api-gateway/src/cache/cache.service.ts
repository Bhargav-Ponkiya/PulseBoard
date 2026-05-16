import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly subscriber: Redis;
  private readonly listeners = new Map<
    string,
    (channel: string, message: string) => void
  >();

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.getOrThrow<string>('REDIS_URL');
    this.redis = new Redis(url);
    this.subscriber = new Redis(url);
  }

  /** Get a cached value by key, deserialized from JSON */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /** Set a value in the cache with an optional TTL in seconds */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl !== undefined) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  /** Delete a key from the cache */
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /** Increment a numeric key and return the new value */
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /** Subscribe to a Redis channel with a message callback */
  subscribe(channel: string, callback: (message: string) => void): void {
    const oldListener = this.listeners.get(channel);
    if (oldListener) {
      this.subscriber.removeListener('message', oldListener);
    }
    const listener = (_channel: string, message: string) => {
      if (_channel === channel) {
        callback(message);
      }
    };
    this.listeners.set(channel, listener);
    void this.subscriber.subscribe(channel);
    this.subscriber.on('message', listener);
  }

  /** Unsubscribe from a Redis channel */
  unsubscribe(channel: string): void {
    const listener = this.listeners.get(channel);
    if (listener) {
      this.subscriber.removeListener('message', listener);
      this.listeners.delete(channel);
    }
    void this.subscriber.unsubscribe(channel);
  }

  async onModuleDestroy(): Promise<void> {
    this.listeners.clear();
    await this.redis.quit();
    await this.subscriber.quit();
  }
}
