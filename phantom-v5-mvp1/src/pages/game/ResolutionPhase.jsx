import React from 'react';
import { motion } from 'framer-motion';

const ResolutionPhase = () => (
  <div className="flex-grow flex flex-col items-center justify-center bg-cyber-card rounded-[50px] border border-cyber-purple/30 relative shadow-2xl p-10">
    <h2 className="text-4xl font-black italic text-cyber-purple mb-6 uppercase tracking-widest">Resolution Phase</h2>
    <p className="text-zinc-400 font-bold">Calculating final outcomes...</p>
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-cyber-purple border-t-transparent rounded-full mt-8"
    />
  </div>
);

export default ResolutionPhase;
