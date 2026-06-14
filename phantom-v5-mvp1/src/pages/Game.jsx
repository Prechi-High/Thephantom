import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Activity, 
  Users, 
  Ghost,
  Target,
  ArrowUpRight
} from 'lucide-react';

const Game = () => {
  const players = useGameStore(state => state.players);
  const timer = useGameStore(state => state.timer);
  const phase = useGameStore(state => state.phase);
  const spin = useGameStore(state => state.spin);
  const eventLog = useGameStore(state => state.eventLog);
  const userPlayerId = useGameStore(state => state.userPlayerId);
  const lastSpinResult = useGameStore(state => state.lastSpinResult);
  const isAccelerated = useGameStore(state => state.isAccelerated);
  const toggleAcceleration = useGameStore(state => state.toggleAcceleration);
  const reviveTeammate = useGameStore(state => state.reviveTeammate);

  const user = useMemo(() => players.find(p => p.id === userPlayerId), [players, userPlayerId]);
  const userSquad = useMemo(() => players.filter(p => p.squadId === user?.squadId), [players, user?.squadId]);
  const leaderboard = useMemo(() => [...players]
    .filter(p => p.status !== 'ELIMINATED')
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10), [players]);

  const [isSpinning, setIsSpinning] = useState(false);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      useGameStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSpin = () => {
    if (isSpinning || user?.status === 'ELIMINATED') return;
    setIsSpinning(true);
    setTimeout(() => {
      spin(userPlayerId);
      setIsSpinning(false);
    }, 800);
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-red-900 grid grid-cols-12 gap-6 p-6 overflow-hidden text-white font-sans">
      {/* LEFT PANEL */}
      <div className="col-span-3 flex flex-col gap-6">
        <div className="bg-cyber-card border border-zinc-800 p-6 rounded-3xl space-y-4">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={12} className="text-cyber-cyan" /> Squad Unit Alpha-5
           </h3>
           <div className="space-y-3">
              {userSquad.map(m => (
                <div key={m.id} className={`flex justify-between items-center p-3 bg-zinc-950/50 rounded-2xl border transition-all ${m.id === userPlayerId ? 'border-cyber-purple' : 'border-zinc-800'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${m.status === 'ELIMINATED' ? 'bg-cyber-red' : m.tokens >= 38 ? 'bg-cyber-cyan' : 'bg-zinc-600'}`} />
                      <span className="text-[10px] font-bold text-zinc-300 truncate w-24 uppercase">{m.username}</span>
                   </div>
                   <div className="text-xs font-black tabular-nums">{m.tokens.toFixed(1)}</div>
                </div>
              ))}
           </div>
           
           {phase === 2 && userSquad.some(m => m.tokens >= 40 && m.tokens < 60) && (
             <motion.button 
               whileHover={{ scale: 1.02 }}
               onClick={() => reviveTeammate(userSquad.find(m => m.tokens >= 40 && m.tokens < 60)?.id, userPlayerId)}
               className="w-full bg-cyber-red text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-neon-red animate-pulse"
             >
               AUTHORIZE REVIVE (-3.0)
             </motion.button>
           )}
        </div>

        <div className="flex-grow bg-cyber-card border border-zinc-800 rounded-3xl p-6 flex flex-col gap-4 overflow-hidden">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity size={12} className="text-cyber-red" /> Global Combat Log
           </h3>
           <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {eventLog.map(log => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`text-[10px] font-bold border-l-2 pl-3 py-1 ${
                  log.type === 'STEAL' ? 'border-cyber-red text-cyber-red' :
                  log.type === 'SHIELD' ? 'border-cyber-cyan text-cyber-cyan' :
                  log.type === 'REVIVE' ? 'border-cyber-purple text-cyber-purple' :
                  'border-zinc-800 text-zinc-400'
                }`}>
                  {log.msg}
                </motion.div>
              ))}
           </div>
        </div>
      </div>

      {/* CENTER: THE SPIN WHEEL ARENA */}
      <div className="col-span-6 flex flex-col gap-6">
        <div className="flex justify-between items-center bg-cyber-card border border-zinc-800 px-10 py-6 rounded-[40px]">
           <div className="flex gap-10">
             <div className="space-y-1">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Active Phase</div>
                <div className="text-xl font-black text-cyber-purple italic uppercase tracking-tight">Phase {phase}</div>
             </div>
             <div className="h-10 w-px bg-zinc-800" />
             <div className="space-y-1">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Timer</div>
                <div className="text-2xl font-black text-cyber-red tabular-nums italic tracking-tighter">{formatTime(timer)}</div>
             </div>
           </div>
           
           <button 
             onClick={toggleAcceleration}
             className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase transition-all ${isAccelerated ? 'bg-cyber-red border-cyber-red text-white' : 'border-zinc-800 text-zinc-600'}`}
           >
             {isAccelerated ? 'MODE: FAST' : 'MODE: NORMAL'}
           </button>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center relative bg-cyber-card border border-zinc-800 rounded-[50px] overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.05),transparent_70%)]" />
           
           <div className="relative mb-12">
              <motion.div 
                animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                transition={isSpinning ? { duration: 0.8, ease: "circOut" } : { duration: 0 }}
                className="w-80 h-80 rounded-full border-4 border-zinc-800 relative flex items-center justify-center p-4 bg-zinc-950 shadow-neon-purple"
              >
                <div className="w-full h-full rounded-full border-2 border-zinc-900 flex flex-col items-center justify-center bg-zinc-900/20 backdrop-blur-sm z-10">
                   <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-2">Phantom Core</div>
                   <div className="text-7xl font-black italic text-white tabular-nums tracking-tighter">{user?.tokens.toFixed(1)}</div>
                   <div className="text-[9px] font-black text-cyber-cyan uppercase tracking-widest mt-3 flex items-center gap-2"><ArrowUpRight size={10} /> Secure</div>
                </div>
              </motion.div>
           </div>

           <AnimatePresence>
             {lastSpinResult && (
               <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute text-cyber-cyan text-4xl font-black italic">
                 {lastSpinResult.label}
               </motion.div>
             )}
           </AnimatePresence>

           <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.95 }}
             onClick={handleSpin}
             disabled={isSpinning || user?.status === 'ELIMINATED'}
             className={`px-32 py-8 rounded-[32px] font-black text-6xl italic transition-all ${
               isSpinning ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black hover:shadow-neon-cyan'
             }`}
           >
             SPIN
           </motion.button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-3 flex flex-col gap-6">
        <div className="bg-cyber-card border border-zinc-800 rounded-3xl p-8 space-y-8 h-fit">
           <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border text-center transition-all ${user?.shieldActive ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan' : 'bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                 <Shield className="mx-auto mb-2" size={24} />
                 <div className="text-[8px] font-black uppercase">Shield {user?.shieldActive ? 'ON' : 'OFF'}</div>
              </div>
              <div className={`p-4 rounded-2xl border text-center transition-all ${user?.cloakActive ? 'bg-cyber-purple/10 border-cyber-purple text-cyber-purple' : 'bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                 <Ghost className="mx-auto mb-2" size={24} />
                 <div className="text-[8px] font-black uppercase">Cloak {user?.cloakActive ? 'ON' : 'OFF'}</div>
              </div>
           </div>
        </div>

        <div className="flex-grow bg-cyber-card border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase text-center"><Target size={12} className="inline text-cyber-gold" /> Rank</h3>
           <div className="flex-grow space-y-2 overflow-y-auto scrollbar-hide">
              {leaderboard.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border ${p.id === userPlayerId ? 'border-cyber-purple' : 'border-zinc-800'}`}>
                   <span className="text-xs font-black text-white">{p.username}</span>
                   <span className="text-xs font-black tabular-nums">{p.tokens.toFixed(1)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
