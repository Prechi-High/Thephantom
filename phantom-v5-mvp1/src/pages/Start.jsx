import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { LayoutGrid, Zap } from 'lucide-react';

const Start = () => {
  const { players, setView } = useGameStore();
  const user = players.find(p => p.isReal) || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-10 max-w-6xl mx-auto space-y-12 bg-cyber-bg h-screen"
    >
      <div className="flex justify-between items-end border-b border-zinc-900 pb-8">
        <div>
          <h2 className="text-sm font-black text-zinc-600 uppercase tracking-widest">Operator Authorization</h2>
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">{user.username}</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Subsection ID</div>
          <div className="text-4xl font-black text-cyber-purple italic">SUB-001</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-cyber-card border border-zinc-800 p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-4 text-zinc-400">
             <LayoutGrid size={20} className="text-cyber-cyan" />
             <span className="font-black uppercase tracking-widest text-xs">Loadout Data</span>
          </div>
          <div className="space-y-4 text-sm font-bold uppercase tracking-tight">
             <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Starting Tokens</span>
                <span className="text-white">0.00</span>
             </div>
             <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Assigned Squad</span>
                <span className="text-cyber-cyan">Alpha-5</span>
             </div>
             <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Entry Fee</span>
                <span className="text-cyber-gold">$5.00</span>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-cyber-card border border-zinc-800 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-center space-y-6">
           <h3 className="text-2xl font-black italic uppercase text-cyber-gold">Mission Parameters</h3>
           <p className="text-xs text-zinc-500 leading-relaxed max-w-lg uppercase font-bold">
              Deployment to Phase 1 requires 6 minutes of sustained token generation. 
              Target threshold locked at 38 tokens. Survival is binary. 
              Manual squad revival permitted within 40-59 token range only.
           </p>
           <Zap size={120} className="absolute -right-4 -bottom-4 text-zinc-800 rotate-12 opacity-30" />
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('LOBBY')}
          className="px-20 py-6 bg-white text-black font-black text-2xl rounded-2xl hover:bg-cyber-cyan transition-all shadow-neon-cyan"
        >
          JOIN SESSION
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Start;
