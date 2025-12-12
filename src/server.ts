import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { checkConnections } from './config';
import { orderQueue } from './queue';
import { websocketManager } from './Manager';

const server = Fastify({ logger: true });

server.register(websocket);

server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection: any, req) => {
    const socket = connection.socket || connection;

    const query = req.query as { orderId: string };
    const orderId = query.orderId;

    if (!orderId) {
      socket.close();
      return;
    }

    websocketManager.addClient(orderId, socket);
  });
});

server.post('/api/orders', async (request, reply) => {
    const body = request.body as { amount: number };
    if (!body.amount) return reply.status(400).send({ error: "Amount required" });

    const orderId = `order_${Date.now()}`;

    // Add to queue
    await orderQueue.add('buy-order', { orderId, amount: body.amount });

    return reply.send({ 
        status: 'pending', 
        orderId, 
        message: 'Order received and queued' 
    });
});

const start = async () => {
  if (!await checkConnections()) process.exit(1);
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();