import { Queue, Worker } from 'bullmq';
import { redisClient, pgPool } from './config';
import { MockDexService } from './services/mockDex';
import { websocketManager } from './Manager';

export const orderQueue = new Queue('order-queue', {
    connection: redisClient
});

const dexService = new MockDexService();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const worker = new Worker('order-queue', async (job) => {
    const { amount, orderId } = job.data;
    
    // Wait for client to connect
    await sleep(3000); 
    
    // // Routing 
    await job.updateProgress(10); 
    websocketManager.notify(orderId, 'routing', { message: 'Fetching quotes from DEXs...' });
    
    console.log(`[Router] Fetching quotes for ${amount} SOL...`);
    
    // Fetch individual quotes
    const raydium = await dexService.getRaydiumQuote('SOL', 'USDC', amount);
    const meteora = await dexService.getMeteoraQuote('SOL', 'USDC', amount);

    console.log(`[Router]  Raydium Price: $${raydium.price}`);
    console.log(`[Router]  Meteora Price: $${meteora.price}`);

    // Decide better one (Lower price)
    const quote = raydium.price < meteora.price ? raydium : meteora;
    
    const decisionLog = `[Router] Best Route: ${quote.dex} ($${quote.price})`;
    console.log(decisionLog); 
    
    // Wait so that user sees statuses
    await sleep(1000); 

    // Creating transaction
    await job.updateProgress(30);
    websocketManager.notify(orderId, 'building', { 
        message: decisionLog 
    });

    await sleep(1000); 

    // Submiting the transaction
    await job.updateProgress(50);
    websocketManager.notify(orderId, 'submitted', { 
        message: 'Transaction sent to network' 
    });

    const result = await dexService.executeTrade(quote.dex, amount);
    
    // Save order history in database
    try {
        await pgPool.query(
            `INSERT INTO orders (order_id, amount, dex, price, tx_hash, status) 
             VALUES ($1, $2, $3, $4, $5, 'confirmed')`,
            [orderId, amount, quote.dex, quote.price, result.txHash]
        );
        console.log(`[DB] Saved order ${orderId} to Database.`);
    } catch (dbError) {
        console.error("Failed to save to DB:", dbError);
    }

    // Confirm the purchase 
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
        await pgPool.query(
            `INSERT INTO orders (order_id, amount, status) VALUES ($1, $2, 'failed')`,
            [orderId, amount]
        ).catch(e => console.error(e));

        websocketManager.notify(orderId, 'failed', { error: err.message });
    }
});

console.log("Queue System Initialized");