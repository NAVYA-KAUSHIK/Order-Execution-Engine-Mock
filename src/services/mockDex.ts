interface Quote {
    dex: 'Raydium' | 'Meteora';
    price: number;
    fee: number;
}

export class MockDexService {
    
    // Pause the code for certain amount of time
    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get a Fake Price from Raydium
    async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200); 
        const basePrice = 100; // Assuming 1SOL is $100
        const price = basePrice * (0.98 + Math.random() * 0.04); 
        
        return { 
            dex: 'Raydium', 
            price: parseFloat(price.toFixed(2)), 
            fee: 0.003 
        };
    }

    // Get a Fake Price from Meteora
    async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200);
        const basePrice = 100;
        const price = basePrice * (0.97 + Math.random() * 0.05);
        
        return { 
            dex: 'Meteora', 
            price: parseFloat(price.toFixed(2)), 
            fee: 0.002 
        };
    }

    // Compare and Pick the Cheaper
    async getBestQuote(amount: number): Promise<Quote> {
        // We hardcode 'SOL' and 'USDC' 
        const [raydium, meteora] = await Promise.all([
            this.getRaydiumQuote('SOL', 'USDC', amount),
            this.getMeteoraQuote('SOL', 'USDC', amount)
        ]);

        // Compare prices (Lower is better for BUYING, Higher is better for SELLING)
        // Assuming we are BUYING SOL, we want the lower price.
        if (raydium.price < meteora.price) {
            return raydium;
        } else {
            return meteora;
        }
    }

    // 4. Simulate the Trade execution
    async executeTrade(dex: string, amount: number) {
        // Random delay between 2000ms and 3000ms
        const delay = 2000 + Math.random() * 1000;
        await this.sleep(delay); 

        return {
            success: true,
            txHash: 'solana_tx_' + Math.random().toString(36).substring(7),
            executedPrice: 100 
        };
    }
}