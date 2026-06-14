import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Skull, CheckCircle, ArrowRight } from 'lucide-react';

const Transition = () => {
  const { phase, players, setView } = useGameStore();
  
  const survivors = players.filter(p => p.status !== 'ELIMINATED');
  const eliminated = players.filter(p => p.status === 'ELIMINATED');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-cyber-bg flex flex-col items-center justify-center space-y-12 p-10 font-sans"
    >
      <div className="text-center space-y-4">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm font-black text-cyber-purple uppercase tracking-[0.5em]"
        >
          SESSION RECONCILIATION
        </motion.h2>
        <motion.h1 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-7xl font-black italic tracking-tighter uppercase text-white drop-shadow-neon-purple"
        >
          Phase {phase - 1} Complete
        </motion.h1>
      </div>

      <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-cyber-card border border-zinc-800 p-8 rounded-[32px] text-center space-y-4 shadow-neon-cyan"
        >
           <CheckCircle className="text-cyber-cyan mx-auto" size={40} />
           <div>
              <div className="text-5xl font-black text-white tabular-nums tracking-tighter">{survivors.length}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Confirmed Survivors</div>
           </div>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-cyber-card border border-zinc-800 p-8 rounded-[32px] text-center space-y-4 shadow-neon-red"
        >
           <Skull className="text-cyber-red mx-auto" size={40} />
           <div>
              <div className="text-5xl font-black text-white tabular-nums tracking-tighter">{eliminated.length}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Units Offline</div>
           </div>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setView('GAME')}
        className="group flex items-center gap-4 px-12 py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-cyber-cyan transition-all hover:scale-105 active:scale-95 shadow-neon-cyan"
      >
        PROCEED TO PHASE {phase}
        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  );
};

export default Transition;
