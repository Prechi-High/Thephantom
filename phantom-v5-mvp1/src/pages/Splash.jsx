import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';

const Splash = () => {
  const { setView, initSimulation } = useGameStore();

  const handleInit = () => {
    initSimulation();
    setView('START');
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-12 bg-cyber-bg relative z-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.05),transparent_70%)]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center relative"
      >
        <h1 className="text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(0,229,255,0.4)]">
          THE PHANTOM
        </h1>
        <p className="text-cyber-cyan uppercase tracking-[0.6em] mt-4 font-bold text-sm">V5 MVP1 SECURITY PROTOCOL</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInit}
        className="group relative px-16 py-5 bg-white text-black font-black text-2xl rounded-2xl cursor-pointer overflow-hidden shadow-neon-cyan"
      >
        <span className="relative z-10">INITIALIZE ARENA</span>
        <div className="absolute inset-0 bg-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default Splash;
