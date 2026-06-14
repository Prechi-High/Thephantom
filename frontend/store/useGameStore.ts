
import { create } from 'zustand';
import { Player, Squad, SessionState, GamePhase, EventLog, Category } from '../types/game';

interface GameStore extends SessionState {
  setPhase: (phase: GamePhase) => void;
  addEvent: (event: Omit<EventLog, 'id' | 'timestamp'>) => void;
  initializeSession: () => void;
  updatePlayerTokens: (playerId: string, amount: number) => void;
  runPhase1Tick: () => void;
  classifyPlayers: () => void;
  revivePlayer: (targetId: string, contributorId: string) => boolean;
  runRankElimination: (survivalPct: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  id: '',
  phase: 'AUTH',
  players: [],
  squads: [],
  eventFeed: [],
  startTime: 0,
  elapsedTime: 0,
  entryFee: 5,
  pool: 500,
  platformFeePct: 0.20,
  winnerAllocationPct: 0.25,

  setPhase: (phase) => set({ phase }),

  addEvent: (event) => {
    const newEvent: EventLog = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({ eventFeed: [newEvent, ...state.eventFeed].slice(0, 100) }));
  },

  initializeSession: () => {
    const players: Player[] = [];
    const squads: Squad[] = [];
    
    // Generate 100 players
    for (let i = 0; i < 100; i++) {
      const squadId = Math.floor(i / 5).toString();
      players.push({
        id: `p${i}`,
        username: `User_${i.toString().padStart(3, '0')}`,
        squadId: squadId,
        tokens: 0,
        status: 'ACTIVE',
        shieldActive: false,
        cloakActive: false,
        shieldDuration: 0,
        cloakDuration: 0,
        isReal: i === 0, // Assume p0 is the current user
      });
    }

    // Generate 20 squads
    for (let i = 0; i < 20; i++) {
      squads.push({
        id: i.toString(),
        name: `Squad ${i + 1}`,
        memberIds: players.filter(p => p.squadId === i.toString()).map(p => p.id),
        cumulativeTokens: 0,
        cumulativeRevives: 0,
      });
    }

    set({ players, squads, phase: 'LOBBY', eventFeed: [] });
  },

  updatePlayerTokens: (playerId, amount) => {
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId ? { ...p, tokens: Math.max(0, p.tokens + amount) } : p
      )
    }));
  },

  runPhase1Tick: () => {
    const state = get();
    if (state.phase !== 'PHASE_1') return;

    const newPlayers = [...state.players];
    
    newPlayers.forEach(p => {
      if (p.status !== 'ACTIVE') return;

      // Token Spin System (Probabilities)
      const roll = Math.random();
      if (roll < 0.4) {
        p.tokens += 1; // 40% chance +1
      } else if (roll < 0.6) {
        p.tokens += 0.5; // 20% chance +0.5
      } else if (roll < 0.7) {
        p.tokens += 2; // 10% chance Advance (+2)
        get().addEvent({ type: 'TOKEN', message: `${p.username} got an Advance Boost!`, playerId: p.id, amount: 2 });
      } else if (roll < 0.8) {
        // Shield activation
        p.shieldActive = true;
        p.shieldDuration = 3; // Lasts 3 ticks
        get().addEvent({ type: 'SHIELD', message: `${p.username} activated SHIELD!`, playerId: p.id });
      } else if (roll < 0.85) {
        // Cloak activation
        p.cloakActive = true;
        p.cloakDuration = 2; // Lasts 2 ticks
        get().addEvent({ type: 'CLOAK', message: `${p.username} used CLOAK!`, playerId: p.id });
      }

      // Steal Mechanic (Logic: Zero-sum)
      if (Math.random() < 0.15) {
        // Target high ranking players
        const targets = newPlayers
          .filter(t => t.id !== p.id && t.status === 'ACTIVE' && !t.cloakActive)
          .sort((a, b) => b.tokens - a.tokens);
        
        const target = targets[Math.floor(Math.random() * Math.min(10, targets.length))];
        if (target) {
          if (target.shieldActive) {
            target.shieldActive = false;
            get().addEvent({ type: 'SHIELD', message: `${target.username}'s shield blocked a steal from ${p.username}!`, playerId: target.id, targetId: p.id });
          } else {
            const amount = Math.min(target.tokens, 1);
            target.tokens -= amount;
            p.tokens += amount;
            get().addEvent({ type: 'STEAL', message: `${p.username} stole ${amount} tokens from ${target.username}!`, playerId: p.id, targetId: target.id, amount });
          }
        }
      }

      // Tick durations
      if (p.shieldDuration > 0) p.shieldDuration--;
      if (p.shieldDuration === 0) p.shieldActive = false;
      if (p.cloakDuration > 0) p.cloakDuration--;
      if (p.cloakDuration === 0) p.cloakActive = false;
    });

    set({ players: newPlayers, elapsedTime: state.elapsedTime + 8 });
  },

  classifyPlayers: () => {
    const players = get().players.map(p => {
      let category: Category = 'C';
      if (p.tokens >= 60) category = 'A';
      else if (p.tokens >= 40) category = 'B';
      
      return { ...p, category };
    });
    set({ players, phase: 'REVIVE_DECISION' });
  },

  revivePlayer: (targetId, contributorId) => {
    const state = get();
    const target = state.players.find(p => p.id === targetId);
    const contributor = state.players.find(p => p.id === contributorId);

    if (!target || !contributor || target.category !== 'B' || contributor.category !== 'A') return false;
    if (contributor.tokens < 3) return false;

    set((state) => ({
      players: state.players.map(p => {
        if (p.id === targetId) return { ...p, status: 'REVIVED', category: 'A' as Category };
        if (p.id === contributorId) return { ...p, tokens: p.tokens - 3 };
        return p;
      })
    }));

    get().addEvent({ type: 'REVIVE', message: `${contributor.username} revived ${target.username} for 3 tokens!`, playerId: contributorId, targetId: targetId });
    return true;
  },

  runRankElimination: (survivalPct) => {
    const players = get().players.filter(p => p.category === 'A' || p.status === 'REVIVED');
    const sorted = [...players].sort((a, b) => b.tokens - a.tokens);
    const survivorCount = Math.floor(sorted.length * survivalPct);
    const survivors = sorted.slice(0, survivorCount);
    const eliminated = sorted.slice(survivorCount);

    set((state) => ({
      players: state.players.map(p => {
        if (eliminated.find(e => e.id === p.id)) return { ...p, status: 'ELIMINATED' };
        if (survivors.find(s => s.id === p.id)) return { ...p, status: 'QUALIFIED' };
        return p;
      })
    }));

    eliminated.forEach(p => {
      get().addEvent({ type: 'ELIMINATION', message: `${p.username} was eliminated (Rank).`, playerId: p.id });
    });
  },
}));
