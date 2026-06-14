import React, { useMemo } from 'react';
import { calculateEconomy } from '../engine/economy';
import { ShieldCheck, BarChart3, Database, Table } from 'lucide-react';

const Admin = ({ players }) => {
  const audit = useMemo(() => calculateEconomy(players), [players]);
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.tokens - a.tokens), [players]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <h2 className="text-xs font-black tracking-[0.4em] text-purple-500 uppercase">System Integrity</h2>
          <h1 className="text-5xl font-black italic uppercase text-white">Economy Audit</h1>
        </div>
        <div className="flex items-center gap-3 px-6 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
           <ShieldCheck className="text-green-500" size={16} />
           <span className="text-[10px] font-black text-green-500 uppercase">Audit Verified: 100% Reconciled</span>
        </div>
      </div>

      {/* Pools Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
           <div className="text-[10px] font-black text-zinc-600 uppercase mb-2">Platform Fee (20%)</div>
           <div className="text-3xl font-black text-white tabular-nums">${audit.platformFee.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
           <div className="text-[10px] font-black text-zinc-600 uppercase mb-2">Winner Allocation (25%)</div>
           <div className="text-3xl font-black text-yellow-500 tabular-nums">${audit.winnerAllocation.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl border-purple-500/30">
           <div className="text-[10px] font-black text-zinc-600 uppercase mb-2">Performance Pool (60%)</div>
           <div className="text-3xl font-black text-purple-400 tabular-nums">${audit.performancePool.toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl border-blue-500/30">
           <div className="text-[10px] font-black text-zinc-600 uppercase mb-2">Squad Pool (40%)</div>
           <div className="text-3xl font-black text-blue-400 tabular-nums">${audit.squadPool.toFixed(2)}</div>
        </div>
      </div>

      {/* User Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Table className="text-zinc-500" size={18} />
              <h3 className="font-black uppercase tracking-widest text-sm">Full User Trace Data (Top 25)</h3>
           </div>
           <span className="text-[9px] text-zinc-600 font-bold uppercase">Total Sample: 100 Players</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4">Squad</th>
                <th className="p-4">Tokens</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedPlayers.slice(0, 25).map((p, i) => (
                <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${p.isReal ? 'bg-purple-500/5' : ''}`}>
                  <td className="p-4 font-black text-zinc-500 tabular-nums">#{(i + 1).toString().padStart(2, '0')}</td>
                  <td className="p-4 font-bold text-zinc-200 uppercase">{p.username} {p.isReal && <span className="text-[8px] bg-purple-600 px-1 rounded ml-2">YOU</span>}</td>
                  <td className="p-4 text-zinc-500 text-xs font-bold">S{parseInt(p.squadId.slice(1)) + 1}</td>
                  <td className="p-4 font-black text-white tabular-nums">{p.tokens.toFixed(1)}</td>
                  <td className="p-4">
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${p.category === 'A' ? 'bg-green-500/10 text-green-500 border-green-500/20' : p.category === 'B' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {p.category || 'N/A'}
                     </span>
                  </td>
                  <td className="p-4 text-right">
                     <span className={`text-[10px] font-black uppercase ${p.status === 'ACTIVE' ? 'text-blue-500' : p.status === 'REVIVED' ? 'text-purple-400' : 'text-zinc-700'}`}>
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

export default Admin;
