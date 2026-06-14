import { create } from 'zustand';

const TOTAL_PLAYERS = 100;
const SQUAD_SIZE = 5;
const PHASE_CONFIG = {
  1: { duration: 360, name: 'Target Phase', target: 38 },
  2: { duration: 360, name: 'Rank Elimination', survival: 0.4 },
  3: { duration: 300, name: 'Hard Elimination', survival: 0.3 },
  4: { duration: 180, name: 'Championship', survival: 1.0 }
};

export const useGameStore = create((set, get) => ({
  // ENGINE STATE
  view: 'SPLASH',
  phase: 1,
  timer: 360,
  isRunning: false,
  isAccelerated: false,
  lastSpinResult: null,
  eventLog: [],

  // DATA STATE
  players: [],
  squads: [],
  userPlayerId: 'p0',

  // CORE ACTIONS
  setView: (view) => set({ view }),
  toggleAcceleration: () => set(state => ({ isAccelerated: !state.isAccelerated })),

  initSimulation: () => {
    const players = Array.from({ length: TOTAL_PLAYERS }, (_, i) => ({
      id: `p${i}`,
      username: `PHANTOM_${i.toString().padStart(3, '0')}`,
      squadId: `s${Math.floor(i / SQUAD_SIZE)}`,
      tokens: 0,
      status: 'ALIVE',
      shieldActive: false,
      cloakActive: false,
      isReal: i === 0,
      revived: false,
      debtTo: null
    }));

    const squads = Array.from({ length: TOTAL_PLAYERS / SQUAD_SIZE }, (_, i) => ({
      id: `s${i}`,
      name: `SQUAD-${(i + 1).toString().padStart(2, '0')}`,
      memberIds: players.filter(p => p.squadId === `s${i}`).map(p => p.id)
    }));

    set({ 
      players, 
      squads, 
      view: 'START', 
      phase: 1, 
      timer: PHASE_CONFIG[1].duration, 
      isRunning: false, 
      eventLog: [] 
    });
  },

  addEvent: (msg, type = 'SYSTEM') => set(state => ({
    eventLog: [{ id: Math.random(), msg, type, time: Date.now() }, ...state.eventLog].slice(0, 20)
  })),

  // SPIN ENGINE
  spin: (playerId) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.status === 'ELIMINATED') return;

    const roll = Math.random();
    let result = { type: 'MISS', value: 0, label: 'MISS' };

    if (roll < 0.30) result = { type: 'TOKEN', value: 1.0, label: '+1.0 TOKEN' };
    else if (roll < 0.50) result = { type: 'TOKEN', value: 0.5, label: '+0.5 TOKEN' };
    else if (roll < 0.65) result = { type: 'ADVANCE', value: 2.0, label: 'ADVANCE +2' };
    else if (roll < 0.75) result = { type: 'SHIELD', value: 0, label: 'SHIELD ACTIVE' };
    else if (roll < 0.85) result = { type: 'CLOAK', value: 0, label: 'CLOAK ACTIVE' };
    else if (roll < 0.95) result = { type: 'STEAL', value: 0, label: 'STEAL TRIGGER' };

    // Update Player State
    const newPlayers = [...state.players];
    const pIdx = newPlayers.findIndex(p => p.id === playerId);
    
    if (result.type === 'TOKEN' || result.type === 'ADVANCE') {
      newPlayers[pIdx].tokens += result.value;
    } else if (result.type === 'SHIELD') {
      newPlayers[pIdx].shieldActive = true;
    } else if (result.type === 'CLOAK') {
      newPlayers[pIdx].cloakActive = true;
      setTimeout(() => {
        set(s => ({ players: s.players.map(p => p.id === playerId ? { ...p, cloakActive: false } : p) }));
      }, 15000); // 15s cloak
    } else if (result.type === 'STEAL') {
      // STEAL RULE: Target highest token players
      const targets = newPlayers
        .filter(v => v.id !== playerId && v.squadId !== player.squadId && v.status === 'ALIVE' && !v.cloakActive && v.tokens > 0)
        .sort((a, b) => b.tokens - a.tokens);
      
      const victim = targets[0];
      if (victim) {
        if (victim.shieldActive) {
          newPlayers[newPlayers.findIndex(v => v.id === victim.id)].shieldActive = false;
          state.addEvent(`${player.username}'s STEAL blocked by ${victim.username}!`, 'SHIELD');
        } else {
          const amount = Math.min(victim.tokens, 1.5);
          newPlayers[newPlayers.findIndex(v => v.id === victim.id)].tokens -= amount;
          newPlayers[pIdx].tokens += amount;
          state.addEvent(`${player.username} STOLE ${amount.toFixed(1)} from ${victim.username}!`, 'STEAL');
        }
      }
    }

    if (player.isReal) set({ lastSpinResult: result });
    set({ players: newPlayers });
  },

  // HEARTBEAT
  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    if (state.timer <= 0) {
      state.handleTransition();
      return;
    }

    // Bot Auto-Spinning
    const botSpinProb = state.isAccelerated ? 0.4 : 0.12;
    state.players.forEach(p => {
      if (!p.isReal && p.status === 'ALIVE' && Math.random() < botSpinProb) {
        state.spin(p.id);
      }
    });

    set({ timer: state.timer - (state.isAccelerated ? 5 : 1) });
  },

  handleTransition: () => {
    const state = get();
    const current = state.phase;

    if (current === 1) {
      // Phase 1 Logic: Target 38
      const newPlayers = state.players.map(p => {
        if (p.tokens >= 60) return { ...p, status: 'PASSED' };
        if (p.tokens >= 40) return p; // Revivable
        return { ...p, status: 'ELIMINATED' };
      });
      set({ players: newPlayers, phase: 2, timer: PHASE_CONFIG[2].duration, view: 'TRANSITION' });
      state.addEvent("PHASE 1 COMPLETE. Target met. Manual revives enabled.");
    } else if (current === 2) {
      // Phase 2: Top 40%
      const alive = state.players.filter(p => p.status !== 'ELIMINATED').sort((a, b) => b.tokens - a.tokens);
      const limit = Math.floor(alive.length * 0.4);
      const survivors = alive.slice(0, limit);
      const newPlayers = state.players.map(p => {
        if (p.status !== 'ELIMINATED' && !survivors.find(s => s.id === p.id)) {
          return { ...p, status: 'ELIMINATED' };
        }
        return p;
      });
      set({ players: newPlayers, phase: 3, timer: PHASE_CONFIG[3].duration, view: 'TRANSITION' });
    } else if (current === 3) {
      // Phase 3: Top 30%
      const alive = state.players.filter(p => p.status !== 'ELIMINATED').sort((a, b) => b.tokens - a.tokens);
      const limit = Math.floor(alive.length * 0.3);
      const survivors = alive.slice(0, limit);
      const newPlayers = state.players.map(p => {
        if (p.status !== 'ELIMINATED' && !survivors.find(s => s.id === p.id)) {
          return { ...p, status: 'ELIMINATED' };
        }
        return p;
      });
      set({ players: newPlayers, phase: 4, timer: PHASE_CONFIG[4].duration, view: 'TRANSITION' });
    } else {
      set({ isRunning: false, view: 'REPORT' });
    }
  },

  // MANUAL REVIVE ACTION
  authorizeRevive: (targetId, donorId) => {
    const state = get();
    const donor = state.players.find(p => p.id === donorId);
    if (!donor || donor.tokens < 3) return false;

    const newPlayers = state.players.map(p => {
      if (p.id === targetId) return { ...p, status: 'ALIVE', revived: true, debtTo: donorId };
      if (p.id === donorId) return { ...p, tokens: p.tokens - 3 };
      return p;
    });

    set({ players: newPlayers });
    state.addEvent(`${donor.username} paid 3 TOKENS to save teammate!`, 'REVIVE');
    return true;
  }
}));
