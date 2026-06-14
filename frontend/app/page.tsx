
'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import AuthScreen from '../components/screens/AuthScreen';
import SessionLobby from '../components/screens/SessionLobby';
import GameScreen from '../components/screens/GameScreen';
import ReviveDecisionScreen from '../components/screens/ReviveDecisionScreen';
import RankEliminationScreen from '../components/screens/RankEliminationScreen';
import ChampionshipScreen from '../components/screens/ChampionshipScreen';
import EconomyAuditScreen from '../components/screens/EconomyAuditScreen';
import AdminSimulationScreen from '../components/screens/AdminSimulationScreen';
import SquadDashboard from '../components/screens/SquadDashboard';

export default function Home() {
  const phase = useGameStore(state => state.phase);

  return (
    <main className="min-h-screen bg-slate-950 text-white font-mono selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {phase === 'AUTH' && <AuthScreen />}
        {phase === 'LOBBY' && <SessionLobby />}
        {phase === 'PHASE_1' && <GameScreen />}
        {phase === 'REVIVE_DECISION' && <ReviveDecisionScreen />}
        {(phase === 'PHASE_2' || phase === 'PHASE_3') && <RankEliminationScreen />}
        {phase === 'CHAMPIONSHIP' && <ChampionshipScreen />}
        {phase === 'ECONOMY_AUDIT' && <EconomyAuditScreen />}
        {phase === 'ADMIN' && <AdminSimulationScreen />}
        {phase === 'SQUAD_DASHBOARD' && <SquadDashboard />}
      </div>
    </main>
  );
}
