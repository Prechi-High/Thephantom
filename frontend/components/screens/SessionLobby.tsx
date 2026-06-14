
'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';

const SessionLobby = () => {
  const { players, squads, setPhase, entryFee, pool } = useGameStore();
  const userPlayer = players.find(p => p.isReal);
  const userSquad = squads.find(s => s.id === userPlayer?.squadId);

  return (
    <div className="space-y-8 py-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-slate-500">Session Lobby</h2>
          <h1 className="text-4xl font-bold">READY TO START?</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase">Total Pool</div>
          <div className="text-3xl font-black text-green-400">${pool.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-6">Your Squad: {userSquad?.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userSquad?.memberIds.map(mId => {
              const p = players.find(player => player.id === mId);
              return (
                <div key={mId} className={`flex items-center gap-4 p-4 rounded-xl border ${p?.isReal ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-800 border-slate-700 opacity-60'}`}>
                  <div className={`w-3 h-3 rounded-full ${p?.isReal ? 'bg-purple-500 animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <div className="font-bold">{p?.username} {p?.isReal && '(YOU)'}</div>
                    <div className="text-xs text-slate-500">{p?.isReal ? 'Player' : 'Bot Member'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase text-slate-400 tracking-wider">Entry Requirements</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Entry Fee</span>
                <span className="font-bold text-purple-400">${entryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Players</span>
                <span className="font-bold">100/100</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Phase 1 Target</span>
                <span className="font-bold">60 Tokens</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setPhase('PHASE_1')}
            className="w-full py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            ENTER ARENA
          </button>
          
          <button
            onClick={() => setPhase('SQUAD_DASHBOARD')}
            className="w-full py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition-all"
          >
            SQUAD DASHBOARD
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">All Squads (20)</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {squads.map(s => (
            <div key={s.id} className={`aspect-square flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-xs font-bold ${s.id === userSquad?.id ? 'border-purple-500 text-purple-400' : 'text-slate-600'}`}>
              S{parseInt(s.id) + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionLobby;
