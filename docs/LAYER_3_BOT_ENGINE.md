# LAYER 3: BOT SIMULATION ENGINE

## Overview
The Phantom uses an internal bot simulation engine to populate sub-sessions with AI-controlled players. Bots are not separate services; they are class instances that interact with the same game engine as real users, ensuring consistent game logic.

---

## Architecture

```
[BotEngine]
    |
    +-- injectBots()      --> Creates User records + adds to Redis state
    |
    +-- simulateBotActions() --> Reads state, decides action, calls GameEngine
    |
    +-- decideAction()    --> Weighted decision matrix based on archetype
```

---

## Bot Archetypes

### 1. Aggressive Bot
- **Behavior**: Prioritizes disruption of other players.
- **Target Selection**: High-token players first.
- **Weight Configuration**:
  - `STEAL`: 40%
  - `ADVANCE`: 20%
  - `TOKEN`: 15%
  - `SHIELD`: 15%
  - `REVIVE`: 10% (only if squad member eliminated)

### 2. Defensive Bot
- **Behavior**: Prioritizes survival and token retention.
- **Target Selection**: No targeting (prefers passive gains).
- **Weight Configuration**:
  - `SHIELD`: 40%
  - `ADVANCE`: 25%
  - `TOKEN`: 20%
  - `STEAL`: 10%
  - `REVIVE`: 5% (only if self has item)

### 3. Balanced Bot
- **Behavior**: Mimics average human player distribution.
- **Target Selection**: Random among alive players.
- **Weight Configuration**:
  - `ADVANCE`: 30%
  - `TOKEN`: 30%
  - `STEAL`: 20%
  - `SHIELD`: 15%
  - `REVIVE`: 5% (only if available)

---

## Decision Matrix

The `decideAction()` method uses a weighted random algorithm:

```typescript
const weights = {
  ADVANCE: 10,
  TOKEN: 10,
  STEAL: 10,
  SHIELD: 10,
  REVIVE: 1,
};

// Contextual modifiers:
if (player.tokens < 10) weights.TOKEN += 20;  // Desperate for tokens
if (player.hasShield) weights.STEAL += 10;    // Feels safe to attack
if (targetCount > 5) weights.SHIELD += 15;   // Crowded, more targets
```

---

## State Awareness

Bots read from Redis to make informed decisions:

1. **Player Count**: If alive players < 10, bot shifts to aggressive (fewer victims).
2. **Token Distribution**: If bot is in bottom 20%, increases `TOKEN` weight by 30%.
3. **Squad Status**: If in a squad, bots coordinate targeting (defend weakest member).

---

## Anti-Collusion Measures

To ensure fair gameplay for real users:

1. **Target Limit**: A bot cannot target the same real user more than once per 30 seconds.
2. **Real User Protection**: If a real user's health drops below 20%, bots within 10 units reduce attack probability by 50%.
3. **Random Variance**: ±10% random noise added to all weights to prevent predictable patterns.

---

## Bot Injection Process

1. `BotEngine.injectBots(subSessionId, 99)` called via BullMQ.
2. Loop creates 99 bot users:
   - `User` record with `type: BOT`.
   - `SubSessionPlayer` entry.
   - `PlayerState` added to Redis `subsession:{id}:state`.
3. Archetypes distributed evenly (33 of each for 99 bots).
4. `simulateBotActions()` starts after sub-session status = `ACTIVE`.

---

## Simulation Loop

```typescript
setInterval(() => {
  const state = getRedisState(subSessionId);
  for (const botId of state.players.filter(isBot)) {
    if (bot.status === 'ELIMINATED') continue;
    
    const action = bot.decideAction(state);
    await GameEngine.processSpin(subSessionId, botId, action);
    
    emitToRoom('spin_result', { botId, action, result });
  }
}, 3000); // Every 3 seconds, all bots take action
```

---

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BOT_INJECTION_DELAY` | 5000ms | Time after sub-session creation before bots spawn |
| `BOT_SPIN_INTERVAL` | 3000ms | Base interval between bot actions |
| `BOT_SPIN_VARIANCE` | ±2000ms | Random variance added to interval |
| `MAX_BOT_TARGETS_PER_USER` | 3 | Max bots that can target same user in 30s |

---

## Future Enhancements (Post-MVP)

- **Machine Learning**: Train models on real player behavior to generate more authentic bots.
- **Bot Personalities**: Named bots with backstories (cosmetic only).
- **Tournament Mode**: Special bot-only sessions for new player practice.
