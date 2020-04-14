import redis, { RedisClient } from 'redis';
import { LoggerWithTarget } from 'probot/lib/wrap-logger';

export class CommentsCacheService {
  constructor(private log: LoggerWithTarget) { }

  public async cache(sauceInfo: SauceInfo) {
    const key = this.getKey(sauceInfo);
    const client = this.getClient();

    try {

      await new Promise(r => client.set(key, 'commented', () => r()));

      // 14 days
      const ttl = +(process.env.COMMENT_TTL || 60 * 60 * 24 * 14);
      await new Promise(r => client.expire(key, ttl, () => r()));
    } finally {
      client.quit();
    }
  }

  public async exists(sauceInfo: SauceInfo) {
    const client = this.getClient();
    return new Promise<boolean>(resolve => {
      try {
        client.get(this.getKey(sauceInfo), (_, y) => {
          this.log(y != null ? `Found sauce in cache, marked as: '${y}'` : `First time sauce was detected`)
          resolve(y != null);
        });
      } finally {
        client.quit();
      }
    });
  }

  private getClient(): RedisClient {
    this.log(`Connecting to redis using ${process.env.REDIS_URL}`);
    return redis.createClient({
      url: process.env.REDIS_URL
    });
  }

  private getKey(sauceInfo: SauceInfo) {
    return JSON.stringify(sauceInfo);
  }
}

export interface SauceInfo {
  repo: string;
  owner: string;
  prNumber: number;
  comment: string;
  path: string;
  line: number;
}

