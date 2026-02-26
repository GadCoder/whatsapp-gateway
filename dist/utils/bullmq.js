import { URL } from 'node:url';
export function resolveBullMqConnection(redis) {
    if (redis.connection) {
        return redis.connection;
    }
    if (!redis.url) {
        throw new Error('Provide redis.url or redis.connection for BullMQ');
    }
    const parsed = new URL(redis.url);
    if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
        throw new Error(`Unsupported Redis URL protocol: ${parsed.protocol}`);
    }
    const dbPath = parsed.pathname.replace('/', '');
    const db = dbPath ? Number.parseInt(dbPath, 10) : undefined;
    return {
        host: parsed.hostname,
        port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        db: Number.isFinite(db ?? NaN) ? db : undefined,
        tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
}
//# sourceMappingURL=bullmq.js.map