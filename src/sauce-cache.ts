import { RedisClient } from 'redis';

export class SauceCache {
  private get client(): RedisClient {
    return new RedisClient({
      url: process.env.REDIS_URL
    });
  }

  public async cache(sauceInfo: SauceInfo) {
    const key = this.getKey(sauceInfo);
    await new Promise(r => this.client.set(key, 'commented', () => r()));

    // 14 days
    const ttl = +(process.env.COMMENT_TTL || 60 * 60 * 24 * 14);
    await new Promise(r => this.client.expire(key, ttl, () => r()));
  }

  public async exists(sauceInfo: SauceInfo) {
    return new Promise<boolean>(resolve => {
      this.client.get(this.getKey(sauceInfo), (x, y) => {
        console.log(y != null ? `[SauceCache] found sauce in cache` : `[SauceCache] first time sauce was detected`)
        resolve(y != null);
      });
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

