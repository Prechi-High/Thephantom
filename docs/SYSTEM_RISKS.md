# SYSTEM RISKS + EDGE CASES

## Overview
This document outlines critical risks, edge cases, and their mitigations for The Phantom game system. Each item is prioritized by severity and likelihood.

---

## 1. Performance Risks

### Risk: Redis Contention on High-Load Spins
- **Severity**: High
- **Likelihood**: High (100 players spinning every 2-3 seconds)
- **Impact**: Spin latency increases, degrading real-time experience.
- **Mitigation**:
  - Use Redis pipelining for multi-command state updates.
  - Implement optimistic locking with `WATCH`/`MULTI`.
  - Offload ledger writes to BullMQ async jobs (do not block on PostgreSQL).

### Risk: Memory Leak from Redis State Growth
- **Severity**: Medium
- **Likelihood**: Medium
- **Impact**: Redis memory grows unbounded if sub-session keys are not cleaned up.
- **Mitigation**:
  - Set TTL on all sub-session keys (e.g., 24 hours).
  - `SessionService` cleanup job deletes keys on session completion.

### Risk: BullMQ Job Backpressure
- **Severity**: Medium
- **Likelihood**: Low
- **Impact**: Jobs queue up if PostgreSQL writes are slow.
- **Mitigation**:
  - Configure `limiter` on queues (max 100 jobs/sec).
  - Use `backoff` strategies for failed jobs.

---

## 2. Game Logic Risks

### Risk: Squad Splitting
- **Severity**: Critical
- **Likelihood**: High (if squads can register late)
- **Impact**: Breaks core game design; squads are separated across sub-sessions.
- **Mitigation**:
  - **Pre-allocation**: During registration, squads are assigned to sub-sessions immediately.
  - **Capacity Check**: If a squad cannot fit, they are placed in a waiting list for the next sub-session.
  - **Max Squad Size**: Enforce `MAX_SQUAD_SIZE = 20` in `SessionRule` to ensure they never exceed capacity.

### Risk: Bot Collusion Against Real Users
- **Severity**: High
- **Likelihood**: Medium
- **Impact**: Real players feel targeted and frustrated.
- **Mitigation**:
  - **Anti-Collusion Limit**: Bots cannot target the same real user more than once per 30-second window.
  - **Dynamic Difficulty**: If a real user's health drops below 20%, nearby bots are less likely to target them.
  - **Bot Cap**: Max 99 bots per 100-player sub-session (1 real user guaranteed).

### Risk: Token Inflation
- **Severity**: Medium
- **Likelihood**: Medium
- **Impact**: Tokens become worthless, breaking the economy.
- **Mitigation**:
  - **Dynamic Weights**: `AdminSetting` allows live tuning of `TOKEN` spin probability.
  - **Sinks**: Forced item purchases (Shields, Insurance) remove tokens from circulation.
  - **Revenue Cap**: Camp revenue is capped at 10% of total session activity.

### Risk: Elimination Loophole (Insurance Abuse)
- **Severity**: Medium
- **Likelihood**: Low
- **Impact**: Players buy multiple Insurance items to retain tokens indefinitely.
- **Mitigation**:
  - **One-Time Use**: Insurance items are consumed on elimination.
  - **Balance Cap**: Insurance price scales with player balance (exponential cost).

---

## 3. Concurrency Risks

### Risk: Double-Spend on Ledger
- **Severity**: Critical
- **Likelihood**: Low
- **Impact**: Player balances become inconsistent (tokens appear/disappear).
- **Mitigation**:
  - All balance updates use **PostgreSQL transactions** (`BEGIN` -> `UPDATE` -> `COMMIT`).
  - Redis is the "view" layer only; PostgreSQL is the source of truth for balances.
  - `TokenLedger` entries are **append-only**; no updates or deletes.

### Risk: Race Condition on Player Spin
- **Severity**: High
- **Likelihood**: Low
- **Impact**: Player spins twice in rapid succession, breaking game state.
- **Mitigation**:
  - **Spin Cooldown**: Redis key `player:{userId}:spin_cooldown` set with 1-second TTL.
  - Server rejects spin if cooldown key exists.

### Risk: Stale State on Reconnect
- **Severity**: Medium
- **Likelihood**: Medium
- **Impact**: Player rejoins with outdated game state.
- **Mitigation**:
  - On `join_subsession`, server pushes full Redis state to client.
  - Client must reconcile local state with server state.
  - `lastUpdate` timestamp in state allows client to detect gaps.

---

## 4. Data Integrity Risks

### Risk: Orphaned SubSessionPlayer Records
- **Severity**: Low
- **Likelihood**: Low
- **Impact**: Database bloat; analytics become inaccurate.
- **Mitigation**:
  - Use `ON DELETE CASCADE` on `SubSessionPlayer.userId` (if user deleted).
  - Cleanup job runs daily to remove stale records.

### Risk: Session Start Time Conflict
- **Severity**: Medium
- **Likelihood**: Low
- **Impact**: Players joining a session that has already started or ended.
- **Mitigation**:
  - Frontend checks `Session.status` before allowing join.
  - Backend double-checks status in `SessionService`.
  - Late joins are rejected if `status !== ACTIVE`.

---

## 5. Edge Cases

### Edge Case: Sub-Session with 0 Real Players
- **Scenario**: All 100 players are bots.
- **Handling**: System allows this for stress testing. Real user flag is only enforced during registration, not runtime.

### Edge Case: Squad Leader Disconnects
- **Scenario**: Squad leader is eliminated or disconnects.
- **Handling**: Leadership transfers to the next active squad member (by join order).

### Edge Case: Bot Ratio Exceeds 99%
- **Scenario**: Only 1 bot in a 100-player sub-session (0.99 bot ratio).
- **Handling**: Enforce `MIN_REAL_PLAYERS = 1` in `SessionRule`. If insufficient real players, session is delayed or cancelled.

### Edge Case: Negative Token Balance
- **Scenario**: Steal causes tokens to go negative due to timing.
- **Handling**: `Math.max(0, player.tokens - stealAmount)` ensures non-negative balances.

### Edge Case: Session Crash Mid-Game
- **Scenario**: Server crashes during active spin phase.
- **Handling**: Redis `AOF` (Append-Only File) persistence enabled. State is recovered from last AOF snapshot. Spins in-flight are replayed from PostgreSQL `Spin` logs.

---

## 6. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Token Cheating | All state changes validated server-side; client is view-only |
| Socket Flooding | Rate limiting via `socket.io-adapter` throttling |
| SQL Injection | Prisma ORM handles parameterized queries |
| XSS | Next.js handles output encoding by default |

---

## Summary Checklist

- [x] Redis pipelining for spin updates
- [x] TTL on all temporary keys
- [x] BullMQ backoff strategies
- [x] Squad pre-allocation logic
- [x] Bot anti-collusion filters
- [x] Dynamic token weight admin settings
- [x] Insurance one-time use flag
- [x] PostgreSQL transactions for ledger
- [x] Spin cooldown Redis keys
- [x] Full state push on reconnect
- [x] Session status gate on join
