
'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, Skull, Medal, Target } from 'lucide-react';

const RankEliminationScreen = () => {
  const { phase, players, runRankElimination, setPhase, addEvent } = useGameStore();
  const [countdown, setTimeLeft] = useState(10);
  
  const activePlayers = players.filter(p => p.status !== 'ELIMINATED').sort((a, b) => b.tokens - a.tokens);
  
  const survivalPct = phase === 'PHASE_2' ? 0.6 : 0.3; // Phase 2: Top 60%, Phase 3: Top 30%
  const cutoffIndex = Math.floor(activePlayers.length * survivalPct);
  const cutoffScore = activePlayers[cutoffIndex - 1]?.tokens || 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          runRankElimination(survivalPct);
          if (phase === 'PHASE_2') setPhase('PHASE_3');
          else setPhase('CHAMPIONSHIP');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, runRankElimination, setPhase, survivalPct]);

  return (
    <div className="space-y-8 py-8 animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-purple-600 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Target size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase">{phase.replace('_', ' ')}</h2>
            <h1 className="text-4xl font-black italic">RANK ELIMINATION</h1>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Elimination In</div>
          <div className="text-4xl font-black tabular-nums text-red-500 animate-pulse">{countdown}S</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest">Survivors</h3>
            <div className="text-3xl font-black text-green-400">{cutoffIndex} / {activePlayers.length}</div>
            <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">Only Top {(survivalPct * 100).toFixed(0)}% Advance</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest">Cutoff Score</h3>
            <div className="text-3xl font-black text-white tabular-nums">{cutoffScore.toFixed(1)}</div>
            <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">Minimum tokens to survive</p>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 grid grid-cols-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">User</div>
            <div className="col-span-1 text-right">Tokens</div>
            <div className="col-span-1 text-right">Status</div>
          </div>
          
          <div className="flex-grow overflow-y-auto max-h-[60vh] scrollbar-hide">
            {activePlayers.map((p, index) => {
              const rank = index + 1;
              const isEliminated = rank > cutoffIndex;
              const isUser = p.isReal;

              return (
                <div 
                  key={p.id} 
                  className={`grid grid-cols-6 items-center p-4 border-b border-slate-800/50 transition-colors ${
                    isUser ? 'bg-purple-600/10' : ''
                  } ${isEliminated ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="col-span-1 flex items-center gap-3">
                    <span className={`text-xs font-black tabular-nums ${rank <= 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      #{rank}
                    </span>
                  </div>
                  
                  <div className="col-span-3 flex items-center gap-3">
                    {rank === 1 && <Trophy size={14} className="text-yellow-400" />}
                    <span className={`font-bold text-sm ${isUser ? 'text-purple-400' : 'text-slate-200'}`}>
                      {p.username} {isUser && '(YOU)'}
                    </span>
                  </div>

                  <div className="col-span-1 text-right font-black tabular-nums text-sm">
                    {p.tokens.toFixed(1)}
                  </div>

                  <div className="col-span-1 text-right">
                    {isEliminated ? (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-500 font-black rounded uppercase flex items-center gap-1 justify-end ml-auto w-fit">
                        <Skull size={10} />
                        OUT
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-500 font-black rounded uppercase flex items-center gap-1 justify-end ml-auto w-fit">
                        SAFE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Cutoff Indicator */}
          <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-center">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.4em]">Elimination Threshold</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankEliminationScreen;
