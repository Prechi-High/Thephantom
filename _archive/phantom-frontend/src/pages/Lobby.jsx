import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { User, Shield, Zap, LayoutGrid } from 'lucide-react';

const Lobby = () => {
  const { players, setView } = useGameStore();
  const user = players[0] || {};

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-end border-b border-zinc-900 pb-8">
        <div>
          <h2 className="text-sm font-black text-zinc-600 uppercase tracking-widest">Player Profile</h2>
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">{user.username}</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Global Rank</div>
          <div className="text-4xl font-black text-purple-500 italic">#142</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* STATS */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-4 text-zinc-400">
             <LayoutGrid size={20} className="text-purple-500" />
             <span className="font-black uppercase tracking-widest text-xs">Account Summary</span>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                <span className="text-[10px] text-zinc-600 font-bold uppercase">Starting Tokens</span>
                <span className="text-xl font-black text-white tabular-nums">0.0</span>
             </div>
             <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                <span className="text-[10px] text-zinc-600 font-bold uppercase">Assigned Squad</span>
                <span className="text-xl font-black text-white uppercase">Alpha-5</span>
             </div>
          </div>
        </div>

        {/* INFO */}
        <div className="md:col-span-2 bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden flex items-center">
           <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black italic uppercase">System Alert</h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-md uppercase font-bold">
                 V5 Simulation detected. Subsection entry fees apply ($5.00). 
                 Target threshold locked at 60 tokens for Phase 1. 
                 Shield protocols are auto-managed by central engine.
              </p>
           </div>
           <Zap size={120} className="absolute -right-4 -bottom-4 text-zinc-800 rotate-12" />
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => setView('BROWSER')}
          className="px-20 py-6 bg-white text-black font-black text-2xl rounded-2xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
        >
          JOIN SESSION
        </button>
      </div>
    </div>
  );
};

export default Lobby;
