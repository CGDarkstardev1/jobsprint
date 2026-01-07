/**
 * Redis Integration Tests
 *
 * Test Redis caching and queue operations
 */

import { createClient } from 'redis';

describe('Redis Integration', () => {
  let client;

  beforeAll(async () => {
    client = createClient({
      socket: {
        host: process.env.TEST_REDIS_HOST || 'localhost',
        port: process.env.TEST_REDIS_PORT || 6379,
      },
      database: 1, // Use test database
    });

    await client.connect();
    await client.flushDb(); // Clear test database
  });

  afterAll(async () => {
    await client.flushDb();
    await client.quit();
  });

  describe('Basic Operations', () => {
    it('should set and get string value', async () => {
      await client.set('test:key', 'test-value');
      const value = await client.get('test:key');

      expect(value).toBe('test-value');
    });

    it('should set with expiration', async () => {
      await client.set('expire:key', 'value', { EX: 1 });
      const value1 = await client.get('expire:key');
      expect(value1).toBe('value');

      await new Promise(resolve => setTimeout(resolve, 1100));
      const value2 = await client.get('expire:key');
      expect(value2).toBeNull();
    });

    it('should delete key', async () => {
      await client.set('delete:key', 'value');
      await client.del('delete:key');
      const value = await client.get('delete:key');

      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await client.set('exists:key', 'value');

      const exists1 = await client.exists('exists:key');
      const exists2 = await client.exists('nonexistent:key');

      expect(exists1).toBe(1);
      expect(exists2).toBe(0);
    });
  });

  describe('Caching Use Cases', () => {
    it('should cache user session', async () => {
      const session = {
        userId: '123',
        email: 'user@example.com',
        createdAt: Date.now()
      };

      await client.setEx(
        `session:${session.userId}`,
        3600,
        JSON.stringify(session)
      );

      const cached = await client.get(`session:${session.userId}`);
      const parsed = JSON.parse(cached);

      expect(parsed).toEqual(session);
    });

    it('should cache API response', async () => {
      const response = {
        data: [1, 2, 3],
        timestamp: Date.now()
      };

      await client.setEx(
        'api:users:list',
        300,
        JSON.stringify(response)
      );

      const cached = await client.get('api:users:list');
      const parsed = JSON.parse(cached);

      expect(parsed.data).toEqual([1, 2, 3]);
    });

    it('should implement cache-aside pattern', async () => {
      const cacheKey = 'cache:aside:test';
      const dbValue = { id: 1, name: 'Test' };

      // Check cache miss
      let cached = await client.get(cacheKey);
      expect(cached).toBeNull();

      // Fetch from DB and cache
      await client.setEx(cacheKey, 60, JSON.stringify(dbValue));

      // Check cache hit
      cached = await client.get(cacheKey);
      const parsed = JSON.parse(cached);
      expect(parsed).toEqual(dbValue);
    });
  });

  describe('Performance', () => {
    it('should handle many operations quickly', async () => {
      const start = Date.now();

      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(client.set(`perf:${i}`, `value${i}`));
      }

      await Promise.all(promises);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in <1s
    });

    it('should use pipeline for bulk operations', async () => {
      const start = Date.now();

      await client.multi()
        .set('multi:1', 'value1')
        .set('multi:2', 'value2')
        .set('multi:3', 'value3')
        .exec();

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
