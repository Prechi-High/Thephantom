import React, { useEffect, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Users } from 'lucide-react';
import SpinPhase from './game/SpinPhase';
import StealPhase from './game/StealPhase';
import ResolutionPhase from './game/ResolutionPhase';

const Game = () => {
  const players = useGameStore(state => state.players);
  const timer = useGameStore(state => state.timer);
  const phase = useGameStore(state => state.phase);
  const eventLog = useGameStore(state => state.eventLog);
  const userPlayerId = useGameStore(state => state.userPlayerId);

  const user = useMemo(() => players.find(p => p.id === userPlayerId), [players, userPlayerId]);
  const userSquad = useMemo(() => players.filter(p => p.squadId === user?.squadId), [players, user?.squadId]);
  const leaderboard = useMemo(() => [...players]
    .filter(p => p.status !== 'ELIMINATED')
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10), [players]);

  useEffect(() => {
    const interval = setInterval(() => useGameStore.getState().tick(), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPhase = () => {
    switch (phase) {
      case 'SPIN': return <SpinPhase />;
      case 'STEAL': return <StealPhase />;
      case 'RESOLUTION': return <ResolutionPhase />;
      default: return <div className="flex-grow flex items-center justify-center bg-cyber-card rounded-[50px] border border-white/5 text-zinc-500 uppercase font-black">Phase {phase} Active</div>;
    }
  };

  return (
    <div className="h-screen bg-cyber-bg grid grid-cols-12 gap-6 p-6 overflow-hidden text-white font-sans pb-24">
      {/* LEFT PANEL: Squad & Logs */}
      <div className="col-span-3 flex flex-col gap-6">
        <div className="bg-cyber-card p-6 rounded-3xl border border-white/5 space-y-4">
           <h3 className="text-[10px] font-black text-cyber-cyan uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={12} /> Squad Unit Alpha-5
           </h3>
           <div className="space-y-2">
              {userSquad.map(m => (
                <div key={m.id} className={`flex justify-between items-center p-3 bg-white/5 rounded-xl border ${m.id === userPlayerId ? 'border-cyber-purple' : 'border-transparent'}`}>
                   <span className="text-[10px] font-bold text-zinc-300 uppercase truncate">{m.username}</span>
                   <span className="text-xs font-black text-cyber-gold tabular-nums">{m.tokens.toFixed(1)}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="flex-grow bg-cyber-card p-6 rounded-3xl border border-white/5 overflow-hidden flex flex-col gap-4">
           <h3 className="text-[10px] font-black text-cyber-red uppercase tracking-[0.3em]">Combat Log</h3>
           <div className="flex-grow overflow-y-auto space-y-2 scrollbar-hide">
              {eventLog.map(log => (
                <div key={log.id} className="text-[10px] font-bold text-zinc-400 border-l-2 border-white/10 pl-3 py-1">
                  {log.msg}
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* CENTER: Dynamic Phase Area */}
      <div className="col-span-6 flex flex-col gap-6">
        <div className="flex justify-between items-center bg-cyber-card px-10 py-6 rounded-[40px] border border-white/5">
           <div className="flex gap-10">
             <div className="space-y-1">
                <div className="text-[9px] font-black text-zinc-500 uppercase">Phase</div>
                <div className="text-xl font-black text-cyber-purple italic">0{phase}</div>
             </div>
             <div className="space-y-1">
                <div className="text-[9px] font-black text-zinc-500 uppercase">Timer</div>
                <div className="text-2xl font-black text-cyber-red tabular-nums italic">{formatTime(timer)}</div>
             </div>
           </div>
        </div>

        {renderPhase()}
      </div>

      {/* RIGHT PANEL: Leaderboard */}
      <div className="col-span-3 flex flex-col gap-6">
        <div className="bg-cyber-card p-8 rounded-3xl border border-white/5 h-full">
           <h3 className="text-[10px] font-black text-cyber-gold uppercase text-center mb-6">Rankings</h3>
           <div className="space-y-2">
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                   <span className="text-xs font-bold text-white">{p.username}</span>
                   <span className="text-xs font-black text-cyber-gold">{p.tokens.toFixed(1)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
