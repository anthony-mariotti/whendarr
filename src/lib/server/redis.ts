import { env } from '$env/dynamic/private';
import { createClient, type RedisClientType } from 'redis';

type RedisConnectEnabled = {
    enabled: true;
    client: RedisClientType
};

type RedisConnectDisabled = {
    enabled: false;
    client: null
}

type RedisConnect = RedisConnectEnabled | RedisConnectDisabled;

let client: RedisClientType | null = null;
let enabled: boolean = false;

if (env.REDIS_URL) {
    try {
        client = createClient({ url: env.REDIS_URL });

        client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        await client.connect();
        console.log('Redis Caching Enabled');
        enabled = true;
    } catch (err) {
        console.error('Redis failed to initialize, continuing eithout cache', err);
        client = null;
        enabled = false;
    }
} else {
    console.log('Redis disabled (no REDIS_URL)');
}

export const redis = {
    enabled,
    client
} as RedisConnect

