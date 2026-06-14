import React, { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Trophy, ShieldCheck, Wallet, ArrowLeft, Crown, Star } from 'lucide-react';

const Report = () => {
  const { players, initSimulation } = useGameStore();
  
  const results = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.tokens - a.tokens);
    const winner = sorted[0];
    const top15 = sorted.slice(1, 16);
    
    const pool = 500;
    const platformFee = pool * 0.20;
    const winnerTake = pool * 0.25;
    const refunds = 10 * 5;
    const rewardPool = pool - platformFee - winnerTake - refunds;
    
    return { winner, top15, platformFee, winnerTake, refunds, rewardPool };
  }, [players]);

  return (
    <div className="min-h-screen bg-cyber-dark p-10 space-y-12 overflow-y-auto">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-8">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">Session Recon</h1>
        <button 
          onClick={initSimulation}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase font-black text-xs"
        >
          <ArrowLeft size={16} /> New Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* WINNER HIGHLIGHT */}
        <div className="lg:col-span-2 space-y-8">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-gradient-to-br from-cyber-purple/20 to-cyber-cyan/10 border-2 border-cyber-purple p-10 rounded-[40px] relative overflow-hidden"
           >
              <div className="absolute top-10 right-10 opacity-10">
                 <Crown size={120} className="text-white" />
              </div>
              
              <div className="relative z-10 space-y-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1 bg-cyber-purple text-white rounded-full text-[10px] font-black uppercase">
                    <Star size={12} /> Session Champion
                 </div>
                 <h2 className="text-8xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_20px_#9c27ff33]">
                   {results.winner.username}
                 </h2>
                 <div className="flex gap-8">
                    <div>
                       <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Final Tokens</div>
                       <div className="text-4xl font-black text-cyber-cyan tabular-nums tracking-tighter">{results.winner.tokens.toFixed(1)}</div>
                    </div>
                    <div className="h-12 w-px bg-zinc-800" />
                    <div>
                       <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Payout</div>
                       <div className="text-4xl font-black text-cyber-gold tabular-nums tracking-tighter">${results.winnerTake.toFixed(2)}</div>
                    </div>
                 </div>
              </div>
           </motion.div>

           <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">Top 15 Combatants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {results.top15.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-zinc-700 w-4">#{(i+2)}</span>
                          <span className="text-xs font-bold text-zinc-300 uppercase">{p.username}</span>
                       </div>
                       <div className="text-xs font-black tabular-nums text-white">{p.tokens.toFixed(1)}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ECONOMY AUDIT */}
        <div className="space-y-6">
           <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-[32px] space-y-8 sticky top-10">
              <div className="flex items-center gap-3 text-cyber-cyan">
                 <ShieldCheck size={24} />
                 <h3 className="font-black uppercase tracking-widest text-sm">Economy Audit</h3>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Initial Pool</span>
                    <span className="text-xl font-black text-white tabular-nums">$500.00</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Platform Fee (20%)</span>
                    <span className="text-xl font-black text-cyber-red tabular-nums">-${results.platformFee.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Winner Take</span>
                    <span className="text-xl font-black text-cyber-gold tabular-nums">-${results.winnerTake.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Squad Refunds</span>
                    <span className="text-xl font-black text-white tabular-nums">-${results.refunds.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Remaining Rewards</span>
                    <span className="text-xl font-black text-cyber-cyan tabular-nums">${results.rewardPool.toFixed(2)}</span>
                 </div>
              </div>

              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                 <div className="flex items-center gap-3">
                    <Wallet size={16} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase text-zinc-400">Total Reconciled</span>
                 </div>
                 <div className="text-4xl font-black italic text-white">$500.00</div>
                 <div className="text-[9px] text-zinc-600 font-bold uppercase">Transaction Integrity Verified</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
