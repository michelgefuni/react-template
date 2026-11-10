import { z } from 'zod';

import { decryptJson, encryptJson, randomId } from './crypto.ts';

export const sessionSchema = z.object({
  id: z.string(),
  sub: z.string(),
  name: z.string(),
  email: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  idToken: z.string(),
  accessTokenExpiresAt: z.number(),
  createdAt: z.number(),
  idleExpiresAt: z.number(),
  absoluteExpiresAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

export interface SessionStore {
  save(session: Session): Promise<void>;
  read(id: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
  acquireLock(key: string, ttlMs: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

interface StringStore {
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

export function createEncryptedStore(
  store: StringStore,
  key: Buffer,
): SessionStore {
  return {
    async save(session) {
      const ttlSeconds = Math.max(
        1,
        Math.floor(
          (Math.min(session.idleExpiresAt, session.absoluteExpiresAt) -
            Date.now()) /
            1000,
        ),
      );
      await store.set(
        sessionKey(session.id),
        encryptJson(session, key),
        ttlSeconds,
      );
    },
    async read(id) {
      const raw = await store.get(sessionKey(id));
      if (!raw) return null;
      const parsed = sessionSchema.safeParse(decryptJson(raw, key));
      return parsed.success ? parsed.data : null;
    },
    async delete(id) {
      await store.delete(sessionKey(id));
    },
    acquireLock(lockKey, ttlMs) {
      return store.setIfAbsent(`lock:${lockKey}`, '1', ttlMs);
    },
    releaseLock(lockKey) {
      return store.delete(`lock:${lockKey}`);
    },
    ping: () => store.ping(),
    close: () => store.close(),
  };
}

export function createMemoryStore(
  key: Buffer,
  backing = new Map<string, string>(),
): SessionStore & {
  backing: Map<string, string>;
} {
  const locks = new Map<string, number>();
  const encrypted = createEncryptedStore(
    {
      async set(keyName, value) {
        backing.set(keyName, value);
      },
      async get(keyName) {
        return backing.get(keyName) ?? null;
      },
      async delete(keyName) {
        backing.delete(keyName);
      },
      async setIfAbsent(keyName, value, ttlMs) {
        const expiresAt = locks.get(keyName) ?? 0;
        if (expiresAt > Date.now()) return false;
        locks.set(keyName, Date.now() + ttlMs);
        backing.set(keyName, value);
        return true;
      },
      async ping() {
        return true;
      },
      async close() {
        backing.clear();
      },
    },
    key,
  );

  return { ...encrypted, backing };
}

export function createRedisStore(
  url: string,
  key: Buffer,
): Promise<SessionStore> {
  return import('ioredis').then(({ default: Redis }) => {
    const redis = new Redis(url, { maxRetriesPerRequest: 1 });
    return createEncryptedStore(
      {
        async set(keyName, value, ttlSeconds) {
          await redis.set(keyName, value, 'EX', ttlSeconds);
        },
        async get(keyName) {
          return redis.get(keyName);
        },
        async delete(keyName) {
          await redis.del(keyName);
        },
        async setIfAbsent(keyName, value, ttlMs) {
          const result = await redis.set(keyName, value, 'PX', ttlMs, 'NX');
          return result === 'OK';
        },
        async ping() {
          return (await redis.ping()) === 'PONG';
        },
        async close() {
          await redis.quit();
        },
      },
      key,
    );
  });
}

export function newSessionId(): string {
  return randomId();
}

function sessionKey(id: string): string {
  return `session:${id}`;
}
