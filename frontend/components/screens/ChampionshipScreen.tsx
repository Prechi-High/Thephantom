
'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Medal, ChevronRight } from 'lucide-react';

const ChampionshipScreen = () => {
  const { players, setPhase } = useGameStore();
  
  const finalists = players
    .filter(p => p.status === 'QUALIFIED')
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 6);
    
  const winner = finalists[0];

  return (
    <div className="py-12 flex flex-col items-center space-y-12">
      {/* WINNER PODIUM */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-yellow-400/20 blur-[100px] rounded-full" />
        
        <div className="relative flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-200 shadow-[0_0_50px_rgba(234,179,8,0.5)]"
          >
            <Crown size={80} className="text-white drop-shadow-lg" />
          </motion.div>
          
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase tracking-[0.5em] text-yellow-500">The Phantom</h2>
            <h1 className="text-6xl font-black italic tracking-tighter uppercase">{winner?.username}</h1>
          </div>
          
          <div className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-full text-xl font-black text-white tabular-nums">
            {winner?.tokens.toFixed(1)} TOKENS
          </div>
        </div>
      </motion.div>

      {/* FINALISTS */}
      <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-5 gap-4">
        {finalists.slice(1).map((p, i) => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center space-y-3"
          >
            <div className={`p-3 rounded-xl ${i === 0 ? 'bg-slate-300 text-slate-900' : i === 1 ? 'bg-orange-400 text-orange-900' : 'bg-slate-800 text-slate-400'}`}>
              <Medal size={24} />
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black text-slate-500 uppercase">Rank #{i + 2}</div>
              <div className="font-bold text-sm truncate w-24">{p.username}</div>
            </div>
            <div className="text-xs font-black tabular-nums">{p.tokens.toFixed(1)}</div>
          </motion.div>
        ))}
      </div>

      {/* ACTION */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setPhase('ECONOMY_AUDIT')}
        className="group flex items-center gap-4 px-12 py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-[0.98]"
      >
        REVEAL ECONOMY AUDIT
        <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </div>
  );
};

export default ChampionshipScreen;
