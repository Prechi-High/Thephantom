# LAYER 4: MVP PHASE BREAKDOWN

## Overview
The Phantom MVP is delivered in 3 sequential phases. Each phase builds on the previous one, ensuring a stable foundation before adding complexity.

---

## Phase 1 — Core Engine (Weeks 1-3)

**Goal**: Establish the real-time game loop and basic economic traceability.

### Deliverables

#### Database & Infrastructure
- [x] Prisma Schema with 18 tables
- [x] Redis configuration for hot-state management
- [x] BullMQ configuration for background jobs
- [x] PostgreSQL connection pool

#### Session System
- [x] `Session` creation and lifecycle
- [x] `SubSession` auto-generation (100-player partitions)
- [x] `SubSessionPlayer` registration

#### Spin Engine
- [x] Real-time spin action via Socket.IO
- [x] Basic action types: ADVANCE, TOKEN
- [x] Redis state updates (low-latency)
- [x] PostgreSQL ledger logging (async via BullMQ)

#### Bot Simulation
- [x] Basic bot injection (99 bots per sub-session)
- [x] Randomized spin actions
- [x] Bot types (Aggressive, Defensive, Balanced) with weighted decision-making

#### Token Economy
- [x] `TokenLedger` for all balance changes
- [x] Double-entry principle (no direct balance updates)
- [x] Basic prize pool distribution

### Success Criteria
- 100 players can spin simultaneously with <100ms latency.
- All token transactions are logged and auditable.
- 99 bots inject and simulate human-like behavior.

---

## Phase 2 — Gameplay Depth (Weeks 4-6)

**Goal**: Add squad mechanics, item system, and elimination rules.

### Deliverables

#### Squad System
- [ ] Squad registration and management
- [ ] **Non-splitting injection logic**: Squads are atomic units
- [ ] Squad leader transfer on disconnect
- [ ] Squad token ledger for shared rewards

#### Item System
- [ ] Shop page (frontend)
- [ ] `SHIELD`: Block next 3 steals
- [ ] `CLOAK`: Invisible for 5 spins (cannot be targeted)
- [ ] `INSURANCE`: Retain 50% tokens on elimination
- [ ] `REVIVE`: Return to life once per session
- [ ] `UserInventory` updates on purchase

#### Elimination Engine
- [ ] Phase-based elimination rules from `SessionRule`
- [ ] Progress-based ranking (progress + tokens)
- [ ] `EliminationService` periodic job
- [ ] Elimination event broadcasting

#### Advanced Bot Logic
- [ ] State-aware targeting (identify high-value targets)
- [ ] Squad coordination (bots in same squad protect each other)
- [ ] Dynamic difficulty adjustment (protect real users if struggling)

### Success Criteria
- Squads function as atomic gameplay units.
- Items have measurable impact on survival rates.
- Elimination engine triggers correctly at phase intervals.

---

## Phase 3 — Economy Layer (Weeks 7-9)

**Goal**: Establish the passive revenue system, progression, and admin tools.

### Deliverables

#### Camp Revenue System
- [ ] Camp creation and ownership
- [ ] `CampService.distributeRevenue()` calculation
- [ ] `CampEarning` ledger entries
- [ ] Camp revenue rate configuration

#### Progression & Achievements
- [ ] XP system tied to session performance
- [ ] `Badge` system with award triggers
- [ ] `UserBadge` issuance on milestones
- [ ] Badge showcase on profile

#### Admin Analytics
- [ ] Real-time session monitoring dashboard
- [ ] Economy health metrics (inflation rate, token sinks)
- [ ] Player behavior analytics
- [ ] Admin settings panel for dynamic tuning

#### Polish
- [ ] Animated spin results (Framer Motion)
- [ ] Sound effects and haptic feedback
- [ ] Mobile-responsive layout
- [ ] PWA support for offline detection

### Success Criteria
- Camp owners earn passive revenue from session activity.
- Badges are awarded for achievements and persist.
- Admins can tune game parameters in real-time without restart.

---

## Timeline Summary

| Phase | Weeks | Focus | Key Milestone |
|-------|-------|-------|---------------|
| 1 | 1-3 | Core Engine | 100-player spin loop works |
| 2 | 4-6 | Gameplay | Squads, items, elimination |
| 3 | 7-9 | Economy | Revenue, progression, admin |

---

## Dependencies

- Phase 2 requires Phase 1's session system and spin engine.
- Phase 3 requires Phase 2's ledger system and player identity.

---

## Scope Boundaries

**Out of MVP Scope (Post-MVP)**:
- Voice chat
- Custom squad emblems
- Tournament mode
- NFT integration
- Cross-session progression (persistent world)
