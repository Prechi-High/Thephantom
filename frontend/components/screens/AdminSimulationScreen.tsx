
'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Play, Activity, Database, Users, RefreshCcw } from 'lucide-react';

const AdminSimulationScreen = () => {
  const { initializeSession, players, squads, runPhase1Tick, classifyPlayers, runRankElimination, setPhase } = useGameStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runFullSim = async () => {
    setIsSimulating(true);
    initializeSession();
    
    // Simulate Phase 1 (45 ticks)
    for (let i = 0; i < 45; i++) {
      runPhase1Tick();
    }
    
    classifyPlayers();
    
    // Auto-revive logic for sim (simple: each survivor revives one teammate if possible)
    const state = useGameStore.getState();
    state.squads.forEach(s => {
      const survivors = state.players.filter(p => p.squadId === s.id && p.category === 'A');
      const revivables = state.players.filter(p => p.squadId === s.id && p.category === 'B');
      
      let donorIdx = 0;
      revivables.forEach(r => {
        if (survivors[donorIdx] && survivors[donorIdx].tokens >= 3) {
          state.revivePlayer(r.id, survivors[donorIdx].id);
          donorIdx = (donorIdx + 1) % survivors.length;
        }
      });
    });

    runRankElimination(0.6); // Phase 2
    runRankElimination(0.3); // Phase 3
    
    const finalState = useGameStore.getState();
    const sorted = [...finalState.players].sort((a, b) => b.tokens - a.tokens);
    
    setResults({
      winner: sorted[0],
      eliminated: finalState.players.filter(p => p.status === 'ELIMINATED').length,
      revived: finalState.players.filter(p => p.status === 'REVIVED').length,
      qualified: finalState.players.filter(p => p.status === 'QUALIFIED').length,
      distribution: {
        A: finalState.players.filter(p => p.category === 'A').length,
        B: finalState.players.filter(p => p.category === 'B').length,
        C: finalState.players.filter(p => p.category === 'C').length,
      }
    });
    
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic flex items-center gap-3">
          <Database className="text-purple-500" />
          SYSTEM SIMULATOR
        </h1>
        <button 
          onClick={runFullSim}
          disabled={isSimulating}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {isSimulating ? <RefreshCcw className="animate-spin" /> : <Play size={18} />}
          RUN MASS SIMULATION
        </button>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Phase 1 Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-green-400">Category A (Pass)</span>
                <span className="text-2xl font-black">{results.distribution.A}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-yellow-400">Category B (Revive)</span>
                <span className="text-2xl font-black">{results.distribution.B}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-red-400">Category C (Dead)</span>
                <span className="text-2xl font-black">{results.distribution.C}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Revive Engine</h3>
            <div className="flex flex-col items-center justify-center h-full pb-6">
              <div className="text-5xl font-black text-purple-400 mb-2">{results.revived}</div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Total Manual Revivals</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Session Outcome</h3>
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 uppercase">Winner</div>
              <div className="text-xl font-black text-yellow-500">{results.winner.username}</div>
              <div className="text-xs text-slate-400 mt-2 italic">{results.qualified} Players completed Phase 3</div>
            </div>
          </div>
        </div>
      )}

      {/* TRACE DATA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
          <Activity size={16} className="text-purple-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Full User Trace Data</h3>
        </div>
        <div className="overflow-x-auto max-h-[40vh] overflow-y-auto scrollbar-hide">
          <table className="w-full text-left text-[10px] font-mono">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-500 uppercase">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Squad</th>
                <th className="p-3">Tokens</th>
                <th className="p-3">Cat</th>
                <th className="p-3">Final Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {players.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-slate-300">{p.id}</td>
                  <td className="p-3 text-slate-500">S{parseInt(p.squadId) + 1}</td>
                  <td className="p-3 font-black tabular-nums">{p.tokens.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded ${
                      p.category === 'A' ? 'bg-green-500/20 text-green-400' :
                      p.category === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {p.category || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={p.status === 'ELIMINATED' ? 'text-red-500' : 'text-green-500'}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSimulationScreen;
