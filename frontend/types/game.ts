
export type Category = 'A' | 'B' | 'C';
export type PlayerStatus = 'ACTIVE' | 'ELIMINATED' | 'QUALIFIED' | 'REVIVED';

export interface Player {
  id: string;
  username: string;
  squadId: string;
  tokens: number;
  status: PlayerStatus;
  category?: Category;
  shieldActive: boolean;
  cloakActive: boolean;
  shieldDuration: number; // in seconds/spins
  cloakDuration: number;
  isReal: boolean;
}

export interface Squad {
  id: string;
  name: string;
  memberIds: string[];
  cumulativeTokens: number;
  cumulativeRevives: number;
}

export type GamePhase = 
  | 'AUTH' 
  | 'LOBBY' 
  | 'PHASE_1' 
  | 'REVIVE_DECISION' 
  | 'PHASE_2' 
  | 'PHASE_3' 
  | 'CHAMPIONSHIP' 
  | 'ECONOMY_AUDIT'
  | 'ADMIN';

export interface EventLog {
  id: string;
  timestamp: number;
  type: 'TOKEN' | 'STEAL' | 'SHIELD' | 'CLOAK' | 'REVIVE' | 'ELIMINATION' | 'SYSTEM';
  message: string;
  playerId?: string;
  targetId?: string;
  amount?: number;
}

export interface SessionState {
  id: string;
  phase: GamePhase;
  players: Player[];
  squads: Squad[];
  eventFeed: EventLog[];
  startTime: number;
  elapsedTime: number; // in seconds
  entryFee: number;
  pool: number;
  platformFeePct: number;
  winnerAllocationPct: number;
}

export interface EconomyAudit {
  platformFee: number;
  winnerAllocation: number;
  refundTierTotal: number;
  performancePool: number;
  squadRewardPool: number;
  userBreakdown: UserPayout[];
}

export interface UserPayout {
  playerId: string;
  username: string;
  rank: number;
  finalTokens: number;
  payout: number;
  isRefund: boolean;
  isWinner: boolean;
  performanceShare: number;
  squadShare: number;
}
