import React, { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, ArrowLeft, Crown, Star, Medal } from 'lucide-react';

const Results = () => {
  const { players, initSimulation } = useGameStore();
  
  const results = useMemo(() => {
    if (!players || players.length === 0) return null;
    const sorted = [...players].sort((a, b) => b.tokens - a.tokens);
    const winner = sorted[0];
    const top15 = sorted.slice(1, 16);
    
    const pool = 500;
    const platformFee = pool * 0.20;
    const winnerTake = pool * 0.25;
    const refunds = 10 * 5;
    const rewardPool = pool - platformFee - winnerTake - refunds;
    
    return { winner, top15, platformFee, winnerTake, refunds, rewardPool, squadTokens: 100 };
  }, [players]);

  if (!results) return (
    <div className="h-screen flex items-center justify-center text-zinc-500 uppercase font-black tracking-widest animate-pulse">
      Reconciling Session Data...
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cyber-bg p-10 space-y-12 overflow-y-auto pb-20 text-white font-sans"
    >
      <div className="flex justify-between items-center border-b border-zinc-900 pb-8">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-neon-purple">Tournament Recon</h1>
        <button 
          onClick={initSimulation}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase font-black text-xs border border-zinc-800 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={16} /> New Deployment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* WINNER PODIUM */}
        <div className="lg:col-span-2 space-y-10">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-cyber-card border-2 border-cyber-purple p-12 rounded-[50px] relative overflow-hidden shadow-neon-purple"
           >
              <div className="absolute top-10 right-10 opacity-10">
                 <Crown size={150} className="text-white" />
              </div>
              
              <div className="relative z-10 space-y-8">
                 <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyber-purple text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Star size={14} className="fill-white" /> Global Champion Verified
                 </div>
                 <h2 className="text-9xl font-black italic tracking-tighter uppercase text-white">
                   {results.winner.username}
                 </h2>
                 <div className="flex gap-12 items-end">
                    <div>
                       <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Final Token Tally</div>
                       <div className="text-6xl font-black text-cyber-cyan tabular-nums tracking-tighter">{results.winner.tokens.toFixed(1)}</div>
                    </div>
                    <div className="h-16 w-px bg-zinc-800" />
                    <div>
                       <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Grand Payout</div>
                       <div className="text-6xl font-black text-cyber-gold tabular-nums tracking-tighter">${results.winnerTake.toFixed(2)}</div>
                    </div>
                 </div>
              </div>
           </motion.div>

           <div className="bg-cyber-card border border-zinc-800 p-10 rounded-[40px] space-y-8">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] border-b border-zinc-900 pb-4">Top 15 Ranking Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {results.top15.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center p-5 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 hover:border-cyber-cyan transition-all group">
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-zinc-700 w-6 group-hover:text-cyber-cyan transition-colors">#{(i+2)}</span>
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{p.username}</span>
                       </div>
                       <div className="text-sm font-black tabular-nums text-white group-hover:text-cyber-cyan transition-colors">{p.tokens.toFixed(1)}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ECONOMY AUDIT */}
        <div className="space-y-6">
           <div className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800 p-10 rounded-[40px] space-y-10 sticky top-10 shadow-2xl">
              <div className="flex items-center gap-4 text-cyber-cyan">
                 <ShieldCheck size={32} />
                 <h3 className="font-black uppercase tracking-[0.2em] text-sm">Forensic Audit</h3>
              </div>

              <div className="space-y-8">
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Prize Pool</span>
                    <span className="text-2xl font-black text-white tabular-nums">$500.00</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Platform Fee (20%)</span>
                    <span className="text-2xl font-black text-cyber-red tabular-nums">-${results.platformFee.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Winner Allocation</span>
                    <span className="text-2xl font-black text-cyber-gold tabular-nums">-${results.winnerTake.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Subsection Refunds</span>
                    <span className="text-2xl font-black text-white tabular-nums">-${results.refunds.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Performance Reward</span>
                    <span className="text-2xl font-black text-cyber-cyan tabular-nums">${results.rewardPool.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Results;
