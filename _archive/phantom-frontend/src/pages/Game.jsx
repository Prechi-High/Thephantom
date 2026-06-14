import React, { useState, useEffect } from 'react';
import { runPhase1Tick, classifyPlayers } from '../engine/simulation';
import { Shield, Ghost, Zap, Activity } from 'lucide-react';

const Game = ({ players, setPlayers, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(10); // Sped up for demo purposes
  const [events, setEvents] = useState(['Session Authorized.', 'Phase 1: Token Generation Started.']);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPlayers(classifyPlayers(players));
          onFinish();
          return 0;
        }
        
        // Run game logic tick
        const nextState = runPhase1Tick(players);
        setPlayers(nextState);
        
        // Random fake event generation
        if (Math.random() < 0.3) {
           const p = nextState[Math.floor(Math.random() * nextState.length)];
           setEvents(prev => [`${p.username} generated tokens.`, ...prev].slice(0, 5));
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [players]);

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-purple-600 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
             <Activity className="text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-widest text-zinc-500 uppercase">Phase 1 Engine</h2>
            <h1 className="text-3xl font-black italic text-white uppercase">Generation Arena</h1>
          </div>
        </div>
        
        <div className="text-right">
           <div className="text-xs font-black text-zinc-600 uppercase tracking-widest">Time Remaining</div>
           <div className="text-4xl font-black tabular-nums text-red-500">{timeLeft}S</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Grid */}
        <div className="xl:col-span-3 grid grid-cols-10 gap-2 bg-zinc-900/50 p-4 border border-zinc-800 rounded-2xl h-fit">
          {players.map(p => (
            <div key={p.id} className={`aspect-square relative flex flex-col items-center justify-center rounded-lg border transition-all duration-300 ${p.tokens >= 60 ? 'bg-green-500/10 border-green-500/30' : p.tokens >= 40 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-zinc-800/50 border-zinc-700'}`}>
              <div className="text-[10px] font-black tabular-nums">{p.tokens.toFixed(1)}</div>
              {p.isReal && <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
              <div className="absolute bottom-1 flex gap-0.5">
                {Math.random() < 0.1 && <Shield size={8} className="text-blue-400" />}
                {Math.random() < 0.05 && <Ghost size={8} className="text-zinc-500" />}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Activity size={14} className="text-purple-500" /> Live Feed
              </h3>
              <div className="space-y-3">
                 {events.map((e, i) => (
                    <div key={i} className="text-[10px] font-bold text-zinc-400 border-l-2 border-zinc-800 pl-3 py-1 animate-in fade-in slide-in-from-left-2">
                       {e}
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Your Status</h3>
              <div className="flex justify-between items-end">
                 <span className="text-[10px] text-zinc-600 font-bold uppercase">Balance</span>
                 <span className="text-2xl font-black text-purple-400">{players[0]?.tokens.toFixed(1)}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (players[0]?.tokens / 60) * 100)}%` }} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
