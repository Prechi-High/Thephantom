
'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Ghost, Zap, TrendingUp, Users, Terminal } from 'lucide-react';

const GameScreen = () => {
  const { 
    players, 
    squads, 
    runPhase1Tick, 
    eventFeed, 
    elapsedTime, 
    classifyPlayers,
    setPhase
  } = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(360 - elapsedTime); // 6 mins = 360s
  const userPlayer = players.find(p => p.isReal);
  const userSquad = squads.find(s => s.id === userPlayer?.squadId);

  // Simulation Timer
  useEffect(() => {
    const tickInterval = setInterval(() => {
      runPhase1Tick();
    }, 2000); // Faster than 8s for simulation UI experience

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tickInterval);
          clearInterval(timerInterval);
          classifyPlayers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(timerInterval);
    };
  }, [runPhase1Tick, classifyPlayers]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 py-4 h-[90vh]">
      {/* LEFT: Player Grid */}
      <div className="xl:col-span-3 space-y-4 flex flex-col">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Phase 1</span>
              <span className="text-xl font-black text-purple-400">TOKEN GENERATION</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Time Remaining</span>
              <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold border border-slate-700">
              <Users size={14} className="text-blue-400" />
              <span>100 ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold border border-slate-700 text-green-400">
              <Zap size={14} />
              <span>LIVE UPDATES</span>
            </div>
          </div>
        </div>

        <div className="flex-grow bg-slate-950 border border-slate-900 rounded-2xl p-4 overflow-hidden relative group">
          <div className="grid grid-cols-10 gap-2 h-full content-start">
            {players.map(p => (
              <motion.div
                key={p.id}
                layout
                className={`aspect-square rounded-md border flex flex-col items-center justify-center relative ${
                  p.isReal ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] z-10' : 
                  p.category === 'A' ? 'bg-green-500/10 border-green-500/30' :
                  'bg-slate-900 border-slate-800 opacity-80'
                }`}
              >
                <div className={`text-[8px] font-black absolute top-1 left-1 px-1 rounded ${p.isReal ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {p.username.split('_')[1]}
                </div>
                
                <div className="text-xs font-black tabular-nums">
                  {p.tokens.toFixed(1)}
                </div>

                <div className="flex gap-1 absolute bottom-1">
                  {p.shieldActive && <Shield size={10} className="text-blue-400 fill-blue-400/20" />}
                  {p.cloakActive && <Ghost size={10} className="text-yellow-400 fill-yellow-400/20" />}
                </div>

                {p.tokens >= 60 && !p.isReal && (
                  <div className="absolute top-0 right-0 p-1">
                    <TrendingUp size={8} className="text-green-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Sidebar & Event Feed */}
      <div className="space-y-6 flex flex-col max-h-full">
        {/* Squad Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Your Squad</h3>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">S{(parseInt(userSquad?.id || '0') + 1)}</span>
          </div>
          
          <div className="space-y-2">
            {userSquad?.memberIds.map(mId => {
              const p = players.find(player => player.id === mId);
              const isPassing = (p?.tokens || 0) >= 60;
              const isRevivable = (p?.tokens || 0) >= 40 && (p?.tokens || 0) < 60;
              
              return (
                <div key={mId} className={`p-3 rounded-xl border flex items-center justify-between ${p?.isReal ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-800/50 border-slate-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isPassing ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : isRevivable ? 'bg-yellow-500' : 'bg-slate-600'}`} />
                    <span className={`text-sm font-bold ${p?.isReal ? 'text-white' : 'text-slate-300'}`}>{p?.username}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums">{p?.tokens.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <div className="text-[10px] text-slate-500 mb-1 font-bold">REVIVE STATUS</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-1/3" />
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-tight uppercase font-bold italic">Manual revive decision phase follows phase 1.</p>
          </div>
        </div>

        {/* Event Feed */}
        <div className="bg-black/40 border border-slate-800 rounded-2xl p-5 flex-grow flex flex-col space-y-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-purple-500" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Session Events</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide text-[11px]">
            <AnimatePresence initial={false}>
              {eventFeed.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2 border-l-2 ${
                    event.type === 'STEAL' ? 'border-red-500 bg-red-500/5' :
                    event.type === 'SHIELD' ? 'border-blue-500 bg-blue-500/5' :
                    event.type === 'TOKEN' ? 'border-green-500 bg-green-500/5' :
                    'border-slate-700 bg-slate-800/20'
                  }`}
                >
                  <div className="text-slate-400 mb-0.5 font-mono text-[9px]">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</div>
                  <div className="text-slate-200">{event.message}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
