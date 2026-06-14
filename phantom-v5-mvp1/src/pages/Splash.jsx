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
    <div className="h-screen flex flex-col items-center justify-center bg-cyber-bg relative overflow-hidden">
      {/* Particle Effect Placeholder */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-cyber-cyan rounded-full opacity-20"
            initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, scale: Math.random() * 0.5 }}
            animate={{ y: [0, -100, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
            style={{ width: Math.random() * 4, height: Math.random() * 4 }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        <h1 className="text-8xl font-black italic tracking-tighter text-white drop-shadow-neon-cyan">
          THE PHANTOM
        </h1>
        <p className="text-cyber-cyan uppercase tracking-[0.6em] mt-4 font-bold text-sm">V5 MVP1 SECURITY PROTOCOL</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 229, 255, 0.6)" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInit}
        className="mt-12 px-16 py-5 bg-transparent border-2 border-cyber-cyan text-cyber-cyan font-black text-2xl rounded-2xl cursor-pointer shadow-neon-cyan hover:bg-cyber-cyan hover:text-black transition-all"
      >
        START SIMULATION
      </motion.button>
    </div>
  );
};

export default Splash;
