import { env } from '$env/dynamic/private';
import redis, { type Redis } from 'ioredis';

type RedisConnect =
    | { enabled: true; client: Redis }
    | { enabled: false; client: null };

let client: Redis | null = null;

let state: RedisConnect = {
    enabled: false,
    client: null
}

try {
    client = new redis(env.REDIS_URL, {
        enableOfflineQueue: false,
    });

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
    });

    client.on('ready', () => {
        console.log('Redis connected');
    });

    client.on('end', () => {
        console.warn('Redis disconnected...');
    });

    client.on('error', () => {

    });

} catch (err) {
    console.error('Redis', err);
}

export {
    client as redis
}