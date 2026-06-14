import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Users, Clock, ChevronRight } from 'lucide-react';

const Lobby = () => {
  const { setView, initSimulation } = useGameStore();

  return (
    <div className="min-h-screen bg-cyber-bg p-12 space-y-12 pb-32">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black italic tracking-tighter uppercase text-white drop-shadow-neon-purple">Active Subsection Lobbies</h1>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em]">Network Scan Complete: 3 Nodes Detected</p>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {[1, 2, 3].map((id, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex flex-col md:flex-row items-center justify-between p-10 bg-cyber-card border border-zinc-800 rounded-[32px] hover:border-cyber-cyan transition-all duration-500 hover:shadow-neon-cyan"
          >
            <div className="flex items-center gap-12">
              <div className="text-4xl font-black italic text-zinc-700 group-hover:text-white transition-colors uppercase tracking-tighter">ZONE-00{id}</div>
              
              <div className="flex gap-16">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-black uppercase mb-2 flex items-center gap-2">
                    <Users size={14} className="text-cyber-cyan" /> Players
                  </span>
                  <span className="text-2xl font-black tabular-nums text-white">{id === 2 ? '99' : id === 3 ? '12' : '84'}/100</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-black uppercase mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-cyber-red" /> Starts In
                  </span>
                  <span className="text-2xl font-black tabular-nums text-cyber-red">{id === 2 ? '00:14' : id === 3 ? '08:22' : '02:45'}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                initSimulation();
                useGameStore.setState({ isRunning: true });
                setView('GAME');
              }}
              className="mt-8 md:mt-0 px-12 py-6 bg-white text-black font-black text-sm uppercase rounded-2xl transition-all flex items-center gap-4 hover:bg-cyber-cyan shadow-lg"
            >
              DEPLOY TO ZONE <ChevronRight size={20} />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Rival Tracker Ticker */}
      <div className="fixed bottom-20 left-0 right-0 bg-black/40 border-t border-b border-white/5 py-2 overflow-hidden">
        <motion.div 
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-xs font-bold text-cyber-cyan uppercase tracking-widest whitespace-nowrap"
        >
          @Viper77 just registered for Rush Hour • Sector 9 stability at 98% • Oracle predicting volatility in Zone-003 • @ShadowBlade secured 500 PHNTM
        </motion.div>
      </div>
    </div>
  );
};

export default Lobby;
