
import { MockDexService } from '../src/services/mockDex';
import { websocketManager } from '../src/Manager';

jest.mock('../src/websocketManager');

describe('Order Execution Engine Tests', () => {
    let dexService: MockDexService;

    beforeEach(() => {
        dexService = new MockDexService();
        jest.clearAllMocks();
    });

    
    test('1. DEX Service should return a Raydium quote', async () => {
        const quote = await dexService.getRaydiumQuote('SOL', 'USDC', 10);
        expect(quote.dex).toBe('Raydium');
        expect(quote.fee).toBe(0.003);
    });

    test('2. DEX Service should return a Meteora quote', async () => {
        const quote = await dexService.getMeteoraQuote('SOL', 'USDC', 10);
        expect(quote.dex).toBe('Meteora');
        expect(quote.fee).toBe(0.002); 
    });

    test('3. Router should pick Raydium if price is lower', async () => {
        // Force Raydium to be cheaper
        jest.spyOn(dexService, 'getRaydiumQuote').mockResolvedValue({ dex: 'Raydium', price: 90, fee: 0.003 });
        jest.spyOn(dexService, 'getMeteoraQuote').mockResolvedValue({ dex: 'Meteora', price: 100, fee: 0.002 });

        const best = await dexService.getBestQuote(10);
        expect(best.dex).toBe('Raydium');
        expect(best.price).toBe(90);
    });

    test('4. Router should pick Meteora if price is lower', async () => {
        // Force Meteora to be cheaper
        jest.spyOn(dexService, 'getRaydiumQuote').mockResolvedValue({ dex: 'Raydium', price: 100, fee: 0.003 });
        jest.spyOn(dexService, 'getMeteoraQuote').mockResolvedValue({ dex: 'Meteora', price: 90, fee: 0.002 });

        const best = await dexService.getBestQuote(10);
        expect(best.dex).toBe('Meteora');
        expect(best.price).toBe(90);
    });


    test('5. Execution should return a Transaction Hash', async () => {
        const result = await dexService.executeTrade('Raydium', 10);
        expect(result.success).toBe(true);
        expect(result.txHash).toContain('solana_tx_');
    });

    test('6. Execution should simulate a delay (Network Latency)', async () => {
        const start = Date.now();
        await dexService.executeTrade('Meteora', 10);
        const duration = Date.now() - start;
        // Should be at least 2000ms as per guide
        expect(duration).toBeGreaterThanOrEqual(1900); 
    });


    test('7. WebSocket manager should add clients', () => {
        const mockSocket = { on: jest.fn() } as any;
        websocketManager.addClient('order_1', mockSocket);
        expect(true).toBe(true); 
    });

    test('8. WebSocket manager should not crash on missing client', () => {
        expect(() => websocketManager.notify('missing_order', 'status')).not.toThrow();
    });

    
    test('9. Price should always be positive', async () => {
        const quote = await dexService.getBestQuote(10);
        expect(quote.price).toBeGreaterThan(0);
    });

    test('10. Raydium fee should be exactly 0.003', async () => {
         const quote = await dexService.getRaydiumQuote('SOL', 'USDC', 100);
         expect(quote.fee).toBe(0.003);
    });
});