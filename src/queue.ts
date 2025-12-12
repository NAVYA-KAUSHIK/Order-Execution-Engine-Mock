import { Queue, Worker } from 'bullmq';
import { redisClient, pgPool } from './config';
import { MockDexService } from './services/mockDex';
import { websocketManager } from './Manager';

export const orderQueue = new Queue('order-queue', {
    connection: redisClient
});

const dexService = new MockDexService();

const worker = new Worker('order-queue', async (job) => {
    const { amount, orderId } = job.data;
    
    // ROUTING (Comparing DEX prices)
    await job.updateProgress(10); 
    websocketManager.notify(orderId, 'routing', { message: 'Comparing DEX prices...' });
    
    const quote = await dexService.getBestQuote(amount);
    
    // BUILDING (Creating transaction)
    await job.updateProgress(30);
    websocketManager.notify(orderId, 'building', { 
        message: `Creating transaction for ${quote.dex} at $${quote.price}` 
    });

    // SUBMITTED (Transaction sent to network)
    // We notify this BEFORE executing, to simulate sending it out
    await job.updateProgress(50);
    websocketManager.notify(orderId, 'submitted', { 
        message: 'Transaction sent to network' 
    });

    // Simulating network delay
    const result = await dexService.executeTrade(quote.dex, amount);
    
    // Save to Database
    try {
        await pgPool.query(
            `INSERT INTO orders (order_id, amount, dex, price, tx_hash, status) 
             VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
            [orderId, amount, quote.dex, quote.price, result.txHash]
        );
        console.log(`Saved order ${orderId} to Database.`);
    } catch (dbError) {
        console.error("Failed to save to DB:", dbError);
    }

    // CONFIRMED (Transaction successful)
    await job.updateProgress(100);
    websocketManager.notify(orderId, 'confirmed', { 
        txHash: result.txHash,
        price: quote.price
    });
    
    return result;

}, {
    connection: redisClient,
    concurrency: 2
});

worker.on('failed', async (job, err) => {
    if (job) {
        const { orderId, amount } = job.data;
        // FAILED
        await pgPool.query(
            `INSERT INTO orders (order_id, amount, status) VALUES ($1, $2, 'failed')`,
            [orderId, amount]
        ).catch(e => console.error(e));

        websocketManager.notify(orderId, 'failed', { error: err.message });
    }
});

console.log("Queue System Initialized");