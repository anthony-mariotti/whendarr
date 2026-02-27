import { env } from '$env/dynamic/private';
import redis, { type Redis } from 'ioredis';

type RedisConnect =
    | { enabled: true; client: Redis }
    | { enabled: false; client: null };

let client: Redis | null = null;
let enabled: boolean = false;

let state: RedisConnect = {
    enabled: false,
    client: null
}

if (env.REDIS_URL) {
    try {
        client = new redis(env.REDIS_URL);

        // client = createClient({
        //     url: env.REDIS_URL,
        //     socket: {
        //         reconnectStrategy: (retries) => {
        //             return Math.min(retries * 100, 5000);
        //         },
        //     }
        // });

        client.on('connect', () => {
            console.log('Redis connecting...');
            enabled = false
        });

        client.on('ready', () => {
            console.log('Redis connected - caching enabled');
            enabled = true
        });

        client.on('end', () => {
            console.warn('Redis disconnected - caching disabled');
            enabled = false
        });

        client.on('error', () => {

        });

        await client.connect();
        console.log('Redis Caching Enabled');
    } catch (err) {
        console.error('Redis failed to initialize, continuing eithout cache')
        console.error('Redis', err);
        enabled = false;
    }
} else {
    console.log('Redis disabled (no REDIS_URL)');
}

export {
    client as redis
}