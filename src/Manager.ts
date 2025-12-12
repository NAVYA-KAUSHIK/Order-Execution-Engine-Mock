import { WebSocket } from 'ws';

// Map storing active connections
const clients = new Map<string, WebSocket>();

export const websocketManager = {
    //  Save a user's connection when they connect
    addClient(orderId: string, socket: WebSocket) {
        clients.set(orderId, socket);
        console.log(`Client connected for ${orderId}`);
        
        // Remove user if they disconnect
        socket.on('close', () => {
            clients.delete(orderId);
            console.log(`Client disconnected: ${orderId}`);
        });
    },

    // Send a message to a specific user
    notify(orderId: string, status: string, data: any = {}) {
        const socket = clients.get(orderId);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ status, ...data }));
        }
    }
};