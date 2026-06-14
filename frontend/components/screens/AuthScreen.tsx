
'use client';

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';

const AuthScreen = () => {
  const initializeSession = useGameStore(state => state.initializeSession);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          THE PHANTOM
        </h1>
        <p className="text-slate-400 max-w-md mx-auto">
          V5 MVP1 - 100 Player Competitive Survival. 
          Token Generation. Squad Revives. Multi-Phase Elimination.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={initializeSession}
            className="px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
          >
            START NOW
          </button>
          <button
            onClick={() => setPhase('ADMIN')}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-full transition-all active:scale-95"
          >
            ADMIN SIM
          </button>
        </div>
        
        <div className="pt-12 grid grid-cols-3 gap-8 opacity-40 grayscale grayscale-0">
          <div className="text-center">
            <div className="text-2xl font-bold">100</div>
            <div className="text-xs uppercase tracking-widest">Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">20</div>
            <div className="text-xs uppercase tracking-widest">Squads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">$500</div>
            <div className="text-xs uppercase tracking-widest">Pool</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
