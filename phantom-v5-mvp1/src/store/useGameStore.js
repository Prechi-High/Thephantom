import { create } from 'zustand';

/**
 * THE PHANTOM V5 MVP1 - CORE ENGINE (ZUSTAND)
 */

const TOTAL_PLAYERS = 100;
const SQUAD_SIZE = 5;

const PHASE_CONFIG = {
  1: { duration: 360, name: 'Phase 1: Target Survival', target: 38 },
  2: { duration: 360, name: 'Phase 2: Rank Elimination', survival: 0.4 },
  3: { duration: 300, name: 'Phase 3: Reduction', survival: 0.3 },
  4: { duration: 180, name: 'Phase 4: Championship', survival: 1.0 }
};

export const useGameStore = create((set, get) => ({
  // SESSION DATA
  view: 'SPLASH', // SPLASH, START, LOBBY, GAME, TRANSITION, RESULTS
  phase: 1,
  timer: 360,
  isRunning: false,
  isAccelerated: false,
  eventLog: [],

  // PLAYER DATA
  players: Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`,
    username: `PHANTOM_${i.toString().padStart(3, '0')}`,
    squadId: `s${Math.floor(i / 5)}`,
    tokens: 0,
    status: 'ALIVE',
    shieldActive: false,
    cloakActive: false,
    isReal: i === 0,
    revived: false,
    contributedTo: null,
  })),
  squads: Array.from({ length: 20 }, (_, i) => ({
    id: `s${i}`,
    name: `SQUAD-${(i + 1).toString().padStart(2, '0')}`,
    memberIds: Array.from({ length: 5 }, (_, j) => `p${i * 5 + j}`)
  })),
  userPlayerId: 'p0',
  lastSpinResult: null,

  // ACTIONS
  setView: (view) => set({ view }),
  toggleAcceleration: () => set(state => ({ isAccelerated: !state.isAccelerated })),

  initSimulation: () => {
    const players = Array.from({ length: TOTAL_PLAYERS }, (_, i) => ({
      id: `p${i}`,
      username: `PHANTOM_${i.toString().padStart(3, '0')}`,
      squadId: `s${Math.floor(i / SQUAD_SIZE)}`,
      tokens: 0,
      status: 'ALIVE', // ALIVE, ELIMINATED, PASSED
      shieldActive: false,
      cloakActive: false,
      isReal: i === 0,
      revived: false,
      contributedTo: null, // Track revive debt
    }));

    const squads = Array.from({ length: TOTAL_PLAYERS / SQUAD_SIZE }, (_, i) => ({
      id: `s${i}`,
      name: `SQUAD-${(i + 1).toString().padStart(2, '0')}`,
      memberIds: players.filter(p => p.squadId === `s${i}`).map(p => p.id),
      squadTokens: 0
    }));

    set({ 
      players, 
      squads, 
      phase: 1, 
      timer: PHASE_CONFIG[1].duration, 
      isRunning: false, 
      eventLog: [] 
    });
  },

  addEvent: (msg, type = 'SYSTEM') => set(state => ({
    eventLog: [{ id: Math.random(), msg, type, time: Date.now() }, ...state.eventLog].slice(0, 15)
  })),

  // SPIN MECHANIC
  spin: (playerId) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.status === 'ELIMINATED') return;

    const roll = Math.random();
    let result = { type: 'MISS', value: 0, label: 'MISS' };

    // Real weights: Target 38 success over 45 spins (8s intervals in 6m)
    if (roll < 0.30) result = { type: 'TOKEN', value: 1.0, label: '+1.0 TOKEN' };
    else if (roll < 0.50) result = { type: 'TOKEN', value: 0.5, label: '+0.5 TOKEN' };
    else if (roll < 0.65) result = { type: 'ADVANCE', value: 2.0, label: 'ADVANCE +2' };
    else if (roll < 0.75) result = { type: 'SHIELD', value: 0, label: 'SHIELD ON' };
    else if (roll < 0.82) result = { type: 'CLOAK', value: 0, label: 'CLOAK ON' };
    else if (roll < 0.95) result = { type: 'STEAL', value: 0, label: 'STEAL ATTEMPT' };

    const newPlayers = [...state.players];
    const pIdx = newPlayers.findIndex(p => p.id === playerId);

    if (result.type === 'TOKEN' || result.type === 'ADVANCE') {
      newPlayers[pIdx].tokens += result.value;
      state.addEvent(`${player.username} gained ${result.value} tokens!`, 'TOKEN');
    } else if (result.type === 'SHIELD') {
      newPlayers[pIdx].shieldActive = true;
      state.addEvent(`${player.username} activated SHIELD!`, 'SHIELD');
    } else if (result.type === 'CLOAK') {
      newPlayers[pIdx].cloakActive = true;
      state.addEvent(`${player.username} is now CLOAKED!`, 'CLOAK');
      // Auto-clear cloak after 15s (simulated as 2 ticks)
      setTimeout(() => {
        set(s => ({ players: s.players.map(p => p.id === playerId ? { ...p, cloakActive: false } : p) }));
      }, 15000);
    } else if (result.type === 'STEAL') {
      // STEAL RULE: Target highest token players not in squad, not cloaked
      const targets = newPlayers
        .filter(v => v.id !== playerId && v.squadId !== player.squadId && v.status === 'ALIVE' && !v.cloakActive && v.tokens > 0)
        .sort((a, b) => b.tokens - a.tokens);
      
      const victim = targets[0];
      if (victim) {
        if (victim.shieldActive) {
          // Consume shield
          newPlayers[newPlayers.findIndex(v => v.id === victim.id)].shieldActive = false;
          state.addEvent(`${player.username}'s steal blocked by ${victim.username}'s SHIELD!`, 'SHIELD');
        } else {
          const amount = Math.min(victim.tokens, 1.5);
          newPlayers[newPlayers.findIndex(v => v.id === victim.id)].tokens -= amount;
          newPlayers[pIdx].tokens += amount;
          state.addEvent(`${player.username} stole ${amount.toFixed(1)} from ${victim.username}!`, 'STEAL');
        }
      } else {
        state.addEvent(`${player.username} failed to find a valid steal target.`, 'SYSTEM');
      }
    }

    if (player.isReal) set({ lastSpinResult: result });
    set({ players: newPlayers });
    return result;
  },

  // HEARTBEAT
  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    if (state.timer <= 0) {
      state.handlePhaseTransition();
      return;
    }

    // Bot Simulation
    const botSpinProb = state.isAccelerated ? 0.35 : 0.125; // ~8s avg
    state.players.forEach(p => {
      if (!p.isReal && p.status === 'ALIVE' && Math.random() < botSpinProb) {
        state.spin(p.id);
      }
    });

    set({ timer: state.timer - (state.isAccelerated ? 5 : 1) });
  },

  handlePhaseTransition: () => {
    const state = get();
    const cur = state.phase;

    if (cur === 1) {
      // Classification Phase 1
      const newPlayers = state.players.map(p => {
        if (p.tokens >= 60) return { ...p, status: 'PASSED' };
        if (p.tokens >= 40) return p; // Revivable range
        return { ...p, status: 'ELIMINATED' };
      });
      set({ players: newPlayers, phase: 2, timer: PHASE_CONFIG[2].duration, view: 'TRANSITION' });
      state.addEvent("PHASE 1 COMPLETE. Squad Revives enabled.");
    } else if (cur === 2) {
      // Top 40%
      const alive = state.players.filter(p => p.status !== 'ELIMINATED').sort((a, b) => b.tokens - a.tokens);
      const survivorsCount = Math.floor(alive.length * 0.4);
      const survivors = alive.slice(0, survivorsCount);
      const newPlayers = state.players.map(p => {
        if (p.status !== 'ELIMINATED' && !survivors.find(s => s.id === p.id)) {
          return { ...p, status: 'ELIMINATED' };
        }
        return p;
      });
      set({ players: newPlayers, phase: 3, timer: PHASE_CONFIG[3].duration, view: 'TRANSITION' });
    } else if (cur === 3) {
      // Top 30%
      const alive = state.players.filter(p => p.status !== 'ELIMINATED').sort((a, b) => b.tokens - a.tokens);
      const survivorsCount = Math.floor(alive.length * 0.3);
      const survivors = alive.slice(0, survivorsCount);
      const newPlayers = state.players.map(p => {
        if (p.status !== 'ELIMINATED' && !survivors.find(s => s.id === p.id)) {
          return { ...p, status: 'ELIMINATED' };
        }
        return p;
      });
      set({ players: newPlayers, phase: 4, timer: PHASE_CONFIG[4].duration, view: 'TRANSITION' });
    } else {
      // END SESSION
      set({ isRunning: false, view: 'RESULTS' });
    }
  },

  // MANUAL SQUAD REVIVE
  reviveTeammate: (targetId, donorId) => {
    const state = get();
    const donor = state.players.find(p => p.id === donorId);
    if (!donor || donor.tokens < 3) return false;

    const newPlayers = state.players.map(p => {
      if (p.id === targetId) return { ...p, status: 'ALIVE', revived: true };
      if (p.id === donorId) return { ...p, tokens: p.tokens - 3 };
      return p;
    });

    set({ players: newPlayers });
    state.addEvent(`${donor.username} paid 3.0 tokens to REVIVE teammate!`, 'REVIVE');
    return true;
  }
}));
