#  Order Execution Engine

An order execution engine that processes Market Order Type with DEX routing and WebSocket status updates - A mock implementation.
**Live Deployment URL:** `https://order-execution-engine-mock-production.up.railway.app'

---

## Architecture

The system follows the following architecture to ensure high concurrency and non-blocking I/O. It separates the API layer (Fastify) from the Execution layer (Worker) using a Redis Queue.


```mermaid
graph TD
    User((Client))
    
    subgraph "API Server (Fastify)"
        API[HTTP Endpoint]
        WS[WebSocket Manager]
    end
    
    subgraph "Async Processing"
        Queue["Redis Queue (BullMQ)"]
        Worker[Worker Node]
    end
    
    subgraph "Data & External"
        DB[(PostgreSQL)]
        DEX[DEX Aggregator Service]
    end

    User -- "1. POST /execute" --> API
    API -- "2. Return OrderID" --> User
    User -- "3. Connect WebSocket" --> WS
    
    API -- "Add Job" --> Queue
    Queue -- "Process Job" --> Worker
    
    Worker -- "Get Price Quotes" --> DEX
    Worker -- "Save Trade" --> DB
    Worker -- "Emit Events" --> WS
    WS -- "4. Real-time Updates" --> User
```

## Live Execution Logs

The engine transparently logs price comparisons between DEXs before executing the best trade:

<img width="865" height="269" alt="Screenshot 2025-12-12 214732" src="https://github.com/user-attachments/assets/46b65773-4fea-4568-9f9e-51d834a0fe5a" />


Production Logs (Railway deployement Logs): 
<img width="1734" height="231" alt="image" src="https://github.com/user-attachments/assets/82e865a2-873e-482c-aa41-f29cac15fd82" />


-----

## Design Decisions

### 1. I chose the **Mock Implementation** (Option B) to keep the main focus on architectural patterns (queues, websockets, routing logic) and flow of the order execution.

  * **Simulated DEX Responses with realistic delays:** I added artificial delays (2-5 seconds) to realistically mimic Solana network congestion.
  * Mock price varied between DEXs with a~2-5% difference.

### 2. The engine processes **Market Orders** (Immediate Execution). This was chosen because it represents the core "Swap" functionality of any DEX.

  **To Extend:**
  *  For *Limit Orders*, we would simply add a "Watcher" service that checks the Database periodically and pushes jobs to the `orderQueue` only when the target price is hit.
  *  For *Sniper Orders*, we would implement a "Launch Listener." Instead of waiting for a user to click buy, the system would constantly scan the blockchain for new "Pool Created" events. The moment a new token becomes tradeable, the system would automatically trigger a buy order.

-----

## Tech Stack:

  * Node.js + TypeScript
  * Fastify (WebSocket support built-in)
  * BullMQ + Redis (order queue)
  * PostgreSQL (order history) + Redis (active orders)
    




-----

##  Setup & Installation

### Prerequisites

  * Node.js (v18+)
  * Redis 
  * PostgreSQL

### 1\. Clone the Repo

```bash
git clone https://github.com/NAVYA-KAUSHIK/Order-Execution-Engine-Mock.git
cd Order-Execution-Engine-Mock
```

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/orders_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 4\. Run Locally

```bash
npm run dev
```
