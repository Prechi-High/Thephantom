import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Users, Clock, ChevronRight } from 'lucide-react';

const Lobby = () => {
  const { setView, initSimulation } = useGameStore();

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 bg-cyber-bg min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(156,39,255,0.3)]">Active Subsection Lobbies</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em]">Network Scan Complete: 3 Nodes Detected</p>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((id, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex flex-col md:flex-row items-center justify-between p-8 bg-cyber-card border border-zinc-800 rounded-3xl hover:border-cyber-cyan transition-all duration-500 hover:shadow-neon-cyan"
          >
            <div className="flex items-center gap-10">
              <div className="text-3xl font-black italic text-zinc-700 group-hover:text-white transition-colors uppercase tracking-tighter">NODE-00{id}</div>
              
              <div className="flex gap-12">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-black uppercase mb-1 flex items-center gap-2">
                    <Users size={12} className="text-cyber-cyan" /> Players
                  </span>
                  <span className="text-xl font-black tabular-nums text-white">{id === 2 ? '99' : id === 3 ? '12' : '84'}/100</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-black uppercase mb-1 flex items-center gap-2">
                    <Clock size={12} className="text-cyber-red" /> Starts In
                  </span>
                  <span className="text-xl font-black tabular-nums text-cyber-red">{id === 2 ? '00:14' : id === 3 ? '08:22' : '02:45'}</span>
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
              className="mt-6 md:mt-0 px-10 py-4 bg-white text-black font-black text-sm uppercase rounded-xl transition-all flex items-center gap-3 hover:bg-cyber-cyan shadow-lg"
            >
              DEPLOY TO NODE <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Lobby;
