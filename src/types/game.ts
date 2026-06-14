export type PlayerState = {
  userId: string;
  username: string;
  squadId: string | null;
  status: 'ALIVE' | 'RESERVE' | 'ELIMINATED';
  tokens: number;
  progress: number;
  inventory: Record<string, number>;
  buffs?: {
    shieldSpins: number;
    cloakSpins: number;
    hasInsurance: boolean;
    hasRevive: boolean;
  };
};

export type SubSessionState = {
  id: string;
  sessionId: string;
  players: Record<string, PlayerState>;
  squadTokens: Record<string, number>; // squadId -> token count for revival
  currentPhase: number;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  startTime: number;
  lastUpdate: number;
};
