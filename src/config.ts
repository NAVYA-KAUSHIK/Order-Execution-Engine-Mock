import { Pool } from 'pg';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

export const redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
    });

export async function checkConnections() {
    try {
        const pgRes = await pgPool.query('SELECT NOW()');
        console.log('Postgres Connected');
        
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE NOT NULL,
                amount DECIMAL NOT NULL,
                dex VARCHAR(20),
                price DECIMAL,
                tx_hash VARCHAR(100),
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "orders" verified/created');
        // 

        await redisClient.ping();
        console.log('Redis Connected');
        return true;
    } catch (error) {
        console.error(' Connection Error:', error);
        return false;
    }
}