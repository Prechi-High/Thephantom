# THE PHANTOM - MVP

Real-time multiplayer strategy + economy game.

## Tech Stack
- **Frontend**: Next.js, Tailwind, Zustand, Framer Motion
- **Backend**: Node.js, Express, Socket.IO, Redis, BullMQ
- **Database**: PostgreSQL, Prisma ORM

## Prerequisites
- Node.js v20.12.2+
- PostgreSQL
- Redis

## Setup & Run

### 1. Database Setup
```bash
# Update .env with your credentials
npx prisma db push
npx ts-node seed.ts
```

### 2. Backend
```bash
# In the root directory
npm install
npm run start # You may need to add this script to package.json
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## System Architecture
- **Session Engine**: Manages global game events and sub-session partitioning.
- **Spin Engine**: Event-driven real-time gameplay loop via Socket.IO and Redis.
- **Bot Engine**: Internal Node.js simulation of aggressive, defensive, and balanced archetypes.
- **Economy Ledger**: Full traceability of all token transactions in PostgreSQL.
