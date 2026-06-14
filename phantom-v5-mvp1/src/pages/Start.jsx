import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Users, Wallet, ChevronRight, Zap } from 'lucide-react';

const Start = () => {
  const { setView, players, userPlayerId } = useGameStore();
  const user = players.find(p => p.id === userPlayerId) || {};

  return (
    <div className="min-h-screen bg-cyber-bg p-10 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-cyber-card border border-zinc-800 rounded-[40px] p-12 space-y-12"
      >
        <div className="flex justify-between items-center border-b border-zinc-800 pb-8">
          <div className="space-y-2">
            <h2 className="text-sm font-black text-cyber-cyan uppercase tracking-[0.3em]">Operator Authorized</h2>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">{user.username}</h1>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Clearance Level</div>
            <div className="text-3xl font-black text-cyber-purple italic">V5-ALPHA</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-zinc-950/50 p-8 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 text-zinc-500 font-black uppercase text-[10px] tracking-widest">
              <Users size={16} className="text-cyber-cyan" /> Identity Data
            </div>
            <div className="text-2xl font-black italic text-white tracking-tight">{user.username}</div>
          </div>
          <div className="bg-zinc-950/50 p-8 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-3 text-zinc-500 font-black uppercase text-[10px] tracking-widest">
              <Wallet size={16} className="text-cyber-gold" /> Current Balance
            </div>
            <div className="text-2xl font-black italic text-cyber-gold tracking-tight">{user.tokens?.toFixed(1)} <span className="text-sm">PHNTM</span></div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0, 229, 255, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setView('LOBBY')}
          className="w-full py-8 bg-transparent border-2 border-white text-white font-black text-2xl uppercase rounded-2xl flex items-center justify-center gap-4 transition-all hover:bg-white hover:text-black"
        >
          DEPLOY TO LOBBY <ChevronRight size={28} />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Start;
