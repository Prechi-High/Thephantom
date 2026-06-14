import React, { useState } from 'react';
import { Heart, UserPlus, ArrowRight, AlertTriangle } from 'lucide-react';

const Revive = ({ players, setPlayers }) => {
  const revivables = players.filter(p => p.category === 'B' && p.status !== 'REVIVED');
  const survivors = players.filter(p => p.category === 'A');
  const [log, setLog] = useState(['Revive system active. Squadmates must authorize token sacrifice.']);

  const handleRevive = (targetId) => {
    // Logic: 3 personal tokens from a survivor
    const donor = survivors.find(s => s.tokens >= 3);
    
    if (!donor) {
      alert("No survivors have enough tokens (min 3) to revive this player!");
      return;
    }

    setPlayers(prev => prev.map(p => {
      if (p.id === targetId) return { ...p, status: 'REVIVED', category: 'A' };
      if (p.id === donor.id) return { ...p, tokens: p.tokens - 3 };
      return p;
    }));

    setLog(prev => [`Authorized: ${donor.username} paid 3 tokens to revive ${players.find(x => x.id === targetId).username}`, ...prev]);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <h2 className="text-xs font-black tracking-[0.4em] text-red-500 uppercase">Revive Authorization</h2>
          <h1 className="text-5xl font-black italic uppercase">Squad Recovery</h1>
        </div>
        <button 
           onClick={() => alert("Moving to Economy Audit...")}
           className="flex items-center gap-4 bg-zinc-100 text-black px-10 py-4 rounded-full font-black hover:bg-white transition-all group"
        >
           PROCEED TO AUDIT
           <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Revivable Pool */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
             <div className="flex items-center gap-4 text-zinc-400">
                <Heart className="text-red-500 fill-red-500/20" size={24} />
                <h3 className="font-black uppercase tracking-widest text-sm">Eligible for Revival (Category B)</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {revivables.map(p => (
                  <div key={p.id} className="bg-zinc-800/50 border border-zinc-700/50 p-6 rounded-xl flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                       <span className="font-bold text-white uppercase tracking-tighter">{p.username}</span>
                       <span className="text-[10px] font-black bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 uppercase">Revivable</span>
                    </div>
                    <div className="text-2xl font-black tabular-nums">{p.tokens.toFixed(1)} <span className="text-zinc-600 text-[10px] uppercase font-bold">Tokens</span></div>
                    <button 
                       onClick={() => handleRevive(p.id)}
                       className="w-full bg-white text-black py-3 rounded-lg font-black text-xs uppercase hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                       <UserPlus size={14} /> Sacrifice 3 Tokens
                    </button>
                  </div>
                ))}
                {revivables.length === 0 && (
                  <div className="col-span-2 py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                     <p className="text-zinc-600 italic uppercase font-bold text-xs">No pending revival authorizations.</p>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 h-48 overflow-y-auto scrollbar-hide">
             <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Sacrifice Log</h4>
             {log.map((l, i) => (
                <div key={i} className="text-[10px] font-bold text-zinc-400 border-l border-zinc-800 pl-3 py-1">
                   {l}
                </div>
             ))}
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-8">
              <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500 text-center">Authorization Stats</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Survivors (Donor Pool)</span>
                    <span className="text-xl font-black text-green-500 tabular-nums">{survivors.length}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Pending Decisions</span>
                    <span className="text-xl font-black text-yellow-500 tabular-nums">{revivables.length}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Permanent Deaths</span>
                    <span className="text-xl font-black text-red-500 tabular-nums">{players.filter(p => p.category === 'C').length}</span>
                 </div>
              </div>
           </div>

           <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <p className="text-[10px] text-red-400 leading-relaxed font-bold uppercase">
                 Critical Rule: Revive cost is deducted from survivors personal session tokens. 
                 If donor falls below 60 after sacrifice, they are not penalized as long as sacrifice was made as a Category A player.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Revive;
