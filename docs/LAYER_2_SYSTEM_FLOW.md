# LAYER 2: SYSTEM FLOW — REAL-TIME GAME ENGINE

## Overview
The Phantom operates as an event-driven, real-time distributed system. The core engine manages the lifecycle of sessions, sub-sessions, and the spin-based gameplay loop. State is maintained in Redis for low-latency access, while PostgreSQL serves as the persistent source of truth.

## Data Flow Architecture

```
[Admin Panel] --> [Express API] --> [PostgreSQL]
                                       |
                                  [BullMQ Jobs]
                                       |
[Socket.IO Clients] <--> [Node.js Server] --> [Redis]
                           (Hot State)      |
                                       [Socket.IO Pub/Sub]
```

---

## 14-Step Game Lifecycle

### Phase 1: Orchestration

**Step 1: Admin Creates Session**
- Admin calls `POST /api/sessions` with:
  - `name`: Session identifier (e.g., "Phantom Arena #1")
  - `startTime`: ISO timestamp for activation
  - `rulesId`: Reference to `SessionRule` (phases, capacity, bot ratio)
- Result: `Session` record created in PostgreSQL with `status: PENDING`.

**Step 2: Session Activation (BullMQ Scheduled Job)**
- BullMQ `sessionQueue` triggers `start-session` job at `startTime`.
- `SessionService.activateSession()` is called.

### Phase 2: Sub-Session Generation

**Step 3: Calculate Sub-Sessions**
- System counts total registered players/squads for the session.
- `numSubSessions = ceil(totalPlayers / capacityPerSubSession)`
- Default capacity: 100 players per sub-session.

**Step 4: Squad Distribution (No Splitting)**
- Squads are fetched in order of registration.
- Each squad is assigned to a sub-session as an **atomic unit**.
- If a squad cannot fit (remaining capacity < squad size), it is moved to the next sub-session.
- **CRITICAL RULE**: A squad's members are NEVER split across sub-sessions.

**Step 5: Bot Injection**
- `BotEngine.injectBots(subSessionId, 99)` is triggered via BullMQ.
- Bots are created as `User` records with `type: BOT`.
- They are added to `SubSessionPlayer` and the Redis state.
- Archetypes are assigned (Aggressive, Defensive, Balanced).

### Phase 3: Pre-Game

**Step 6: Shop Phase (60 seconds)**
- Sub-session status moves to `WAITING`.
- Players can purchase items from the shop:
  - `SHIELD`: Blocks steals for 3 spins
  - `CLOAK`: Invisible for 5 spins
  - `INSURANCE`: Keep 50% tokens on elimination
  - `REVIVE`: Return to life once
- Items are stored in `UserInventory`.

### Phase 4: Active Gameplay

**Step 7: Spin Phase Begins**
- Sub-session status moves to `ACTIVE`.
- BullMQ starts a recurring job to trigger `EliminationService`.

**Step 8: Player Spin Action**
- Player clicks "SPIN" button on frontend.
- Frontend emits `socket.emit('spin', { subSessionId, userId })`.
- Backend receives event in [index.ts](file:///c:/Users/hp/Documents/Thephantom/src/index.ts).

**Step 9: GameEngine Resolution**
- `GameEngine.processSpin()` executes:
  1. Validate player status from Redis state.
  2. Calculate action result (Advance, Steal, Shield, etc.).
  3. Update player state in Redis (`subsession:{id}:state`).
  4. Emit `spin_result` to all players in sub-session via Socket.IO.
  5. Queue async job to write to `Spin` and `TokenLedger` tables.

**Step 10: Elimination Engine**
- BullMQ triggers elimination check every phase interval (e.g., 5 minutes).
- `EliminationService.runEliminationPhase()` executes:
  1. Sort alive players by progress (desc), then tokens (desc).
  2. Eliminate bottom N players based on `SessionRule`.
  3. Update `SubSessionPlayer.status` to `ELIMINATED` in PostgreSQL.
  4. Apply Insurance logic (if player has item, retain % of tokens).
  5. Emit `elimination` event to all players.

### Phase 5: Closure & Revenue

**Step 11: Session Completion**
- When 1 player remains (or time limit reached):
  - Sub-session status moves to `FINISHED`.
  - Winner is determined and awarded prize pool.

**Step 12: Token Distribution**
- `GameEngine.distributeRewards()` executes:
  - Winners receive tokens from prize pool.
  - All transactions are logged in `TokenLedger`.

**Step 13: Camp Revenue Distribution**
- `CampService.distributeRevenue(sessionId)` executes:
  - Calculates total session activity (total spins).
  - Distributes revenue to camp owners based on `revenueRate`.
  - Logs all transactions in `CampEarning`.

**Step 14: Final Cleanup**
- Redis keys for sub-session are cleared.
- `Session.status` moves to `COMPLETED`.
- `SystemLog` entries are created for audit trail.

---

## Redis State Schema

**Key**: `subsession:{subSessionId}:state`
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "status": "WAITING | ACTIVE | FINISHED",
  "players": {
    "userId": {
      "userId": "uuid",
      "username": "PhantomBot_1",
      "squadId": null,
      "status": "ALIVE",
      "tokens": 150,
      "progress": 42,
      "inventory": { "SHIELD": 2 }
    }
  },
  "startTime": 1717600000000,
  "lastUpdate": 1717600050000
}
```

**Key**: `subsession:{subSessionId}:leaderboard`
- Sorted Set (ZSET) for O(log N) leaderboard queries.
- Score: `tokens * 10000 + progress` for secondary sort.

---

## Socket.IO Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_subsession` | Client -> Server | `{ subSessionId, userId }` | Player joins a sub-session room |
| `state_update` | Server -> Client | `SubSessionState` | Periodic state broadcast |
| `spin` | Client -> Server | `{ subSessionId, userId }` | Player triggers a spin |
| `spin_result` | Server -> Client | `{ userId, action, result }` | Result of a spin |
| `elimination` | Server -> Client | `{ userId }` | A player was eliminated |
| `session_end` | Server -> Client | `{ winners }` | Session has finished |

---

## BullMQ Job Definitions

| Queue | Job Name | Trigger | Handler |
|-------|----------|---------|---------|
| `session-queue` | `inject-bots` | Session Activation | `BotEngine.injectBots()` |
| `session-queue` | `elimination-check` | Every 5 min (active session) | `EliminationService.runEliminationPhase()` |
| `session-queue` | `distribute-revenue` | Session End | `CampService.distributeRevenue()` |
| `bot-queue` | `simulate-bots` | Sub-session Active | `BotEngine.simulateBotActions()` |

---

## PostgreSQL + Redis Data Flow

1. **Write Path (Hot)**: Spin actions update Redis first (sub-ms latency).
2. **Write Path (Cold)**: BullMQ jobs batch-write ledger entries to PostgreSQL.
3. **Read Path**: On reconnect, server sends full Redis state to client.
4. **Recovery**: If Redis fails, state is reconstructed from PostgreSQL `Spin` logs (slow but safe).

This architecture ensures the system can handle thousands of concurrent spins per second while maintaining full economic auditability.
