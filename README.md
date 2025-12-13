#  Order Execution Engine

An order execution engine that processes Market Order Type with DEX routing and WebSocket status updates - A mock implementation.

**Live Deployment URL:** [https://order-execution-engine-mock-production.up.railway.app](https://order-execution-engine-mock-production.up.railway.app)
** Youtube Video Link: [https://youtu.be/vpv_YRanMGY?feature=shared](https://youtu.be/vpv_YRanMGY?feature=shared)
---

## Architecture

The system follows the following architecture to ensure high concurrency and non-blocking I/O.


<img width="1431" height="732" alt="Untitled-2025-12-13-0952" src="https://github.com/user-attachments/assets/fd3973f0-6cbb-4a0a-8386-f2630ee55250" />

## Data Flow

1.  Client sends a POST **request**; API pushes it to the **Redis Queue** and returns an Order ID.
2.  The **Worker** picks up the job from the queue.
3.  **ROUTING:** Worker fetches quotes from Raydium & Meteora, compares them, and selects the best route.
4.  **Execution Progress Updates:** Updates such as pending, routing, building etc. are pushed via **WebSockets** to the client while the trade is saved to **PostgreSQL**.

## Execution Logs

<img width="865" height="269" alt="Screenshot 2025-12-12 214732" src="https://github.com/user-attachments/assets/46b65773-4fea-4568-9f9e-51d834a0fe5a" />

## Production Logs (Railway deployement Logs): 
<img width="1734" height="231" alt="image" src="https://github.com/user-attachments/assets/82e865a2-873e-482c-aa41-f29cac15fd82" />

## 10 unit tests covering routing logic, queue behaviour, and WebSocket lifecycle

<img width="721" height="369" alt="Screenshot 2025-12-13 115526" src="https://github.com/user-attachments/assets/571357bf-8f42-45da-8c65-ba42c2b80082" />


-----

## Design Decisions

### 1. I chose the **Mock Implementation** (Option B) to keep the main focus on architectural patterns (queues, websockets, routing logic) and flow of the order execution.

  * **Simulated DEX Responses with realistic delays:** I added artificial delays (2-5 seconds) to realistically mimic Solana network congestion.
  * Mock price varied between DEXs with a ~2-5% difference.

### 2. The engine processes **Market Orders** (Immediate Execution at current price). This was chosen because it represents the core Swap functionality of any DEX.

  **The Implementation can be extended as follows:**
  *  For *Limit Orders*, we would simply add a Watcher type of service that checks the Database periodically and pushes jobs to the `orderQueue` only when the target price is hit.
  *  For *Sniper Orders*, we would implement a " Market Listener." This service waits for the specific signal that a new trading pool has opened. The moment trading begins, our system triggers and executes the buy order to get the best possible entry price.

-----

## Tech Stack:

  * Node.js + TypeScript
  * Fastify (WebSocket support built-in)
  * BullMQ + Redis (order queue)
  * PostgreSQL (order history) + Redis (active orders)
    




-----

## Postman 

Import postman_collection.json in Postman and hit send.

##  Local Setup 

### Please Make Sure you have the following before running:

  * Node.js (v18+)
  * Redis 
  * PostgreSQL

### 1\. Clone the Repository

```bash
git clone https://github.com/NAVYA-KAUSHIK/Order-Execution-Engine-Mock.git
cd Order-Execution-Engine-Mock
```

### 2\. Run

```bash
npm install
```

### 3\. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/orders_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

### 4\. Run Locally

```bash
npm run dev
```
## 5\. Running Unit Tests

```bash
npx jest
