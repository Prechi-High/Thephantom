import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Activity, 
  Users, 
  TrendingUp, 
  Target, 
  Ghost,
  ChevronRight,
  Info
} from 'lucide-react';

const Session = () => {
  const { 
    players, 
    timer, 
    phase, 
    spin, 
    eventLog, 
    userPlayerId, 
    lastSpinResult,
    isAccelerated,
    toggleAcceleration,
    authorizeRevive
  } = useGameStore();

  const user = players.find(p => p.id === userPlayerId);
  const userSquad = players.filter(p => p.squadId === user?.squadId);
  const leaderboard = [...players]
    .filter(p => p.status !== 'ELIMINATED')
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    if (isSpinning || user?.status === 'ELIMINATED') return;
    setIsSpinning(true);
    // Real-time animation delay
    setTimeout(() => {
      spin(userPlayerId);
      setIsSpinning(false);
    }, 600);
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-cyber-dark text-zinc-100 font-mono p-4 grid grid-cols-12 gap-4 overflow-hidden relative">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#9c27ff22,transparent_50%)] pointer-events-none" />
      
      {/* LEFT PANEL: PLAYER STATS */}
      <div className="col-span-3 flex flex-col gap-4">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 p-6 rounded-3xl space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest flex items-center gap-2">
              <Users size={12} /> Active Node
            </span>
            <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">V5-MVP1</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase truncate">{user?.username}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Alpha Squad-05</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
               <div className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Session Rank</div>
               <div className="text-xl font-black text-white tabular-nums">#{players.filter(p => p.tokens > user?.tokens).length + 1}</div>
            </div>
            <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
               <div className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Status</div>
               <div className={`text-xs font-black uppercase ${user?.status === 'ELIMINATED' ? 'text-cyber-red' : 'text-cyber-cyan'}`}>
                 {user?.status}
               </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border transition-all ${user?.shieldActive ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_10px_#00e5ff33]' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>
                <Shield size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Shield Protocol</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border transition-all ${user?.cloakActive ? 'bg-cyber-purple/10 border-cyber-purple text-cyber-purple shadow-[0_0_10px_#9c27ff33]' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>
                <Ghost size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Cloak Drive</span>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-zinc-900/20 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 flex flex-col gap-4 overflow-hidden">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity size={12} className="text-cyber-red" /> Data Stream
           </h3>
           <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {eventLog.map(log => (
                <div key={log.id} className={`text-[10px] font-bold border-l-2 pl-3 py-1 animate-in slide-in-from-left-2 duration-300 ${
                  log.type === 'STEAL' ? 'border-cyber-red text-cyber-red' :
                  log.type === 'SHIELD' ? 'border-cyber-cyan text-cyber-cyan' :
                  'border-zinc-800 text-zinc-400'
                }`}>
                  {log.msg}
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* CENTER: SPIN WHEEL & MAIN HUB */}
      <div className="col-span-6 flex flex-col gap-4 relative">
        {/* TOP HUD */}
        <div className="grid grid-cols-2 gap-4 h-24">
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl flex items-center justify-center gap-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="text-center">
                 <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Phase {phase}</div>
                 <div className="text-xl font-black text-cyber-purple italic uppercase tracking-tighter">
                   {PHASE_CONFIG[phase].name}
                 </div>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="text-center">
                 <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Countdown</div>
                 <div className="text-2xl font-black text-cyber-red tabular-nums italic">{formatTime(timer)}</div>
              </div>
           </div>

           <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl flex items-center justify-between px-10">
              <div className="flex items-center gap-4">
                 <TrendingUp className="text-cyber-gold" size={20} />
                 <div>
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Session Pool</div>
                    <div className="text-2xl font-black text-cyber-gold tabular-nums tracking-tighter">$500.00</div>
                 </div>
              </div>
              <button 
                onClick={toggleAcceleration}
                className={`text-[9px] font-black px-3 py-1 rounded-full border transition-all ${isAccelerated ? 'bg-cyber-red text-white border-cyber-red shadow-[0_0_10px_#ff005544]' : 'text-zinc-600 border-zinc-800'}`}
              >
                {isAccelerated ? 'FAST MODE' : 'REAL TIME'}
              </button>
           </div>
        </div>

        {/* SPIN AREA */}
        <div className="flex-grow flex flex-col items-center justify-center relative">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00e5ff05,transparent_70%)]" />
           
           <div className="relative mb-12">
              <motion.div 
                animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                transition={isSpinning ? { duration: 0.6, ease: "circIn" } : { duration: 0 }}
                className="w-80 h-80 rounded-full border-4 border-zinc-800 relative flex items-center justify-center p-4 bg-zinc-950 shadow-[0_0_100px_rgba(156,39,255,0.1)]"
              >
                {/* Visual spokes */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute h-full w-0.5 bg-zinc-900" style={{ transform: `rotate(${i * 45}deg)` }} />
                ))}
                
                <div className="w-full h-full rounded-full border-2 border-zinc-900 flex flex-col items-center justify-center bg-zinc-900/20">
                   <div className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-2">Phantom Core</div>
                   <div className="text-7xl font-black italic text-white tabular-nums tracking-tighter shadow-sm">
                     {user?.tokens.toFixed(1)}
                   </div>
                   <div className="text-[10px] font-black text-cyber-cyan uppercase tracking-widest mt-2">Tokens Secured</div>
                </div>
              </motion.div>
              
              {/* Spinner Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-8 bg-cyber-gold clip-path-polygon-[50%_100%,0_0,100%_0] z-20 shadow-[0_0_15px_#ffcc0044]" />
           </div>

           <AnimatePresence>
             {lastSpinResult && (
               <motion.div
                 initial={{ opacity: 0, y: -20, scale: 0.8 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 1.2 }}
                 className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
               >
                 <div className={`px-12 py-4 rounded-full border-2 font-black text-3xl italic tracking-tighter shadow-[0_0_50px_rgba(255,255,255,0.1)] ${
                   lastSpinResult.type === 'TOKEN' ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' :
                   lastSpinResult.type === 'ADVANCE' ? 'bg-cyber-gold/20 border-cyber-gold text-cyber-gold' :
                   lastSpinResult.type === 'STEAL' ? 'bg-cyber-red/20 border-cyber-red text-cyber-red' :
                   'bg-zinc-800 border-zinc-600 text-zinc-400'
                 }`}>
                   {lastSpinResult.label}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <button
             onClick={handleSpin}
             disabled={isSpinning || user?.status === 'ELIMINATED'}
             className={`px-24 py-8 rounded-3xl font-black text-5xl italic transition-all active:scale-95 group relative overflow-hidden ${
               isSpinning || user?.status === 'ELIMINATED' 
               ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
               : 'bg-white text-black hover:bg-zinc-200'
             }`}
           >
             <span className="relative z-10">SPIN</span>
             {!isSpinning && user?.status !== 'ELIMINATED' && (
                <div className="absolute inset-0 bg-cyber-cyan opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
             )}
           </button>
        </div>

        {/* BOTTOM SQUAD DOCK */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex justify-between items-center relative overflow-hidden">
           <div className="flex gap-4">
              {userSquad.map(m => (
                <div key={m.id} className="relative">
                   <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-[10px] transition-all ${
                     m.isReal ? 'border-cyber-purple bg-cyber-purple/20 text-white' :
                     m.status === 'ELIMINATED' ? 'border-zinc-900 bg-black text-zinc-800' :
                     'border-zinc-800 bg-zinc-800/40 text-zinc-400'
                   }`}>
                     {m.username.split('_')[1]}
                   </div>
                   {m.tokens >= 60 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-cyan rounded-full border-2 border-zinc-900" />}
                </div>
              ))}
           </div>
           
           <div className="flex items-center gap-6">
              {phase === 2 && userSquad.find(m => m.tokens >= 40 && m.tokens < 60) && (
                 <motion.button 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   onClick={() => authorizeRevive(userSquad.find(m => m.tokens < 60 && m.status !== 'ELIMINATED')?.id, userPlayerId)}
                   className="bg-cyber-red text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-[0_0_15px_#ff005555] animate-pulse"
                 >
                   AUTHORIZE REVIVE (-3.0)
                 </motion.button>
              )}
              <div className="text-right">
                 <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Squad Loadout</div>
                 <div className="text-xs font-black text-white italic">CYBER-PUNK // ALPHA-5</div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL: LEADERBOARD */}
      <div className="col-span-3 bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col gap-6 overflow-hidden">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2">
           <Target size={12} className="text-cyber-gold" /> Leaderboard
        </h3>
        
        <div className="flex-grow space-y-2 overflow-y-auto pr-2 scrollbar-hide">
           {leaderboard.map((p, i) => (
             <motion.div 
               key={p.id}
               layout
               className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                 p.id === userPlayerId ? 'bg-cyber-purple/10 border-cyber-purple/50' : 'bg-zinc-950/30 border-zinc-800/50'
               }`}
             >
                <div className="flex items-center gap-3">
                   <span className="text-[9px] font-black text-zinc-600 tabular-nums w-4">{(i+1).toString().padStart(2, '0')}</span>
                   <span className={`text-xs font-bold uppercase ${p.id === userPlayerId ? 'text-white' : 'text-zinc-400'}`}>
                     {p.username}
                   </span>
                </div>
                <div className="text-xs font-black tabular-nums text-white">{p.tokens.toFixed(1)}</div>
             </motion.div>
           ))}
        </div>

        <div className="bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800/50 space-y-4">
           <div className="flex items-center gap-2 text-zinc-500">
              <Info size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Phase 1 Target</span>
           </div>
           <div className="flex justify-between items-end">
              <div className="text-3xl font-black tabular-nums italic">60.0</div>
              <div className="w-1/2 bg-zinc-800 h-1 rounded-full overflow-hidden">
                 <div className="bg-cyber-cyan h-full transition-all duration-1000" style={{ width: `${Math.min(100, (user?.tokens / 60) * 100)}%` }} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Session;
