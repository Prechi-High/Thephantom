import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

const Splash = () => {
  const initGame = useGameStore(state => state.initGame);

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          THE PHANTOM <span className="text-purple-500">V5</span>
        </h1>
        <p className="text-zinc-500 uppercase tracking-[0.4em] mt-4 font-bold">Tournament Survival Protocol</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={initGame}
        className="group relative px-16 py-5 bg-white text-black font-black text-2xl rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]"
      >
        <span className="relative z-10">INITIALIZE</span>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      <div className="absolute bottom-10 text-[10px] text-zinc-800 uppercase font-black tracking-[0.2em]">
        © 2026 Phantom Systems - Secure Simulation Node
      </div>
    </div>
  );
};

export default Splash;
