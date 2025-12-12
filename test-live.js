const WebSocket = require('ws');

const RAILWAY_DOMAIN = 'ordercheck-production.up.railway.app'; 

async function runLiveTest() {
    console.log(`[Client] Submitting Order to ${RAILWAY_DOMAIN}...`);
    
    // POST request
    const response = await fetch(`https://${RAILWAY_DOMAIN}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50 })
    });
    
    const data = await response.json();
    console.log(`[Client] Order Created. ID: ${data.orderId}`);
    console.log(`[Client] Initial Status: ${data.status}`);

    console.log("[Client] Connecting to WebSocket...");
    const ws = new WebSocket(`wss://${RAILWAY_DOMAIN}/ws?orderId=${data.orderId}`);

    ws.on('open', () => {
        console.log("[WS] Connected. Waiting for updates...");
    });

    ws.on('message', (msg) => {
        const update = JSON.parse(msg.toString());
        console.log(`[WS] Update: ${update.status.toUpperCase()} -`, update);
        
        if (update.status === 'confirmed' || update.status === 'failed') {
            console.log("[Client] Process Finished. Closing connection.");
            ws.close();
        }
    });
    
    ws.on('error', (err) => {
        console.error("[WS] Error:", err.message);
    });
}

runLiveTest();