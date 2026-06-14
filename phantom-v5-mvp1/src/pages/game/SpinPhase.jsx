import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';

const SpinPhase = () => {
  const { userPlayerId, spin, spinCount, user } = useGameStore();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    if (isSpinning || user?.status === 'ELIMINATED') return;
    setIsSpinning(true);
    spin(userPlayerId);
    setTimeout(() => setIsSpinning(false), 800);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-cyber-card rounded-[50px] border border-white/5 relative shadow-2xl">
      <motion.div 
        animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
        className="w-72 h-72 rounded-full border-4 border-cyber-cyan/30 flex items-center justify-center shadow-neon-purple"
      >
        <div className="text-6xl font-black italic text-white tabular-nums">{user?.tokens.toFixed(1)}</div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 229, 255, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSpin}
        className="mt-12 px-20 py-6 bg-cyber-cyan text-black font-black text-3xl italic rounded-2xl"
      >
        SPIN ({spinCount})
      </motion.button>
    </div>
  );
};

export default SpinPhase;
