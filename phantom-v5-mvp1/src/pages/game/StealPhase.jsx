import React from 'react';
import { motion } from 'framer-motion';

const StealPhase = () => (
  <div className="flex-grow flex flex-col items-center justify-center bg-cyber-card rounded-[50px] border border-cyber-red/30 relative shadow-2xl p-10">
    <h2 className="text-4xl font-black italic text-cyber-red mb-6 uppercase tracking-widest">Steal Phase</h2>
    <p className="text-zinc-400 font-bold mb-8">Deploy your resources to claim tokens from targets.</p>
    {/* Placeholder for Steal Target UI */}
    <div className="w-full h-40 bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
      Steal Targets Grid Placeholder
    </div>
  </div>
);

export default StealPhase;
