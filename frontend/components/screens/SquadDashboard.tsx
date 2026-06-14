
'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';
import { Users, History, Award, TrendingUp, ArrowLeft } from 'lucide-react';

const SquadDashboard = () => {
  const { players, squads, setPhase } = useGameStore();
  const userPlayer = players.find(p => p.isReal);
  const userSquad = squads.find(s => s.id === userPlayer?.squadId);
  
  const members = players.filter(p => p.squadId === userSquad?.id);

  return (
    <div className="space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Users className="text-white" />
          </div>
          <h1 className="text-3xl font-black italic">SQUAD DASHBOARD</h1>
        </div>
        <button 
          onClick={() => setPhase('LOBBY')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Return to Lobby
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SQUAD STATS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Squad Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase">Name</span>
              <span className="font-black text-white">{userSquad?.name}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase">Rank</span>
              <span className="font-black text-blue-400">#4 / 20</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-slate-400 text-xs font-bold uppercase">Total Tokens</span>
              <span className="font-black text-green-400">142.5</span>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4">Historical Performance</h3>
            <div className="h-24 flex items-end gap-1 px-2">
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <div key={i} className="flex-grow bg-blue-500/20 border-t-2 border-blue-500 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* MEMBER LIST */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Squad Members</h3>
          </div>
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Lifetime Tokens</th>
                <th className="p-4 text-right">Revives</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {members.map(m => (
                <tr key={m.id} className={m.isReal ? 'bg-blue-500/5' : ''}>
                  <td className="p-4 font-bold">
                    <div className="flex items-center gap-2">
                      {m.username}
                      {m.isReal && <span className="text-[8px] bg-blue-500 px-1 rounded">YOU</span>}
                    </div>
                  </td>
                  <td className="p-4 tabular-nums text-slate-300">452.0</td>
                  <td className="p-4 text-right tabular-nums">12</td>
                  <td className="p-4 text-right">
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 font-black rounded uppercase">Active</span>
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

export default SquadDashboard;
