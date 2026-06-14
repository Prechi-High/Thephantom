
'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, UserPlus, Info, AlertTriangle, ArrowRight } from 'lucide-react';

const ReviveDecisionScreen = () => {
  const { players, squads, revivePlayer, setPhase } = useGameStore();
  const userPlayer = players.find(p => p.isReal);
  const userSquad = squads.find(s => s.id === userPlayer?.squadId);
  
  const squadMembers = players.filter(p => p.squadId === userSquad?.id);
  const survivors = squadMembers.filter(p => p.category === 'A');
  const revivables = squadMembers.filter(p => p.category === 'B' && p.status !== 'REVIVED');
  const eliminated = squadMembers.filter(p => p.category === 'C');

  const [selectedRevivable, setSelectedRevivable] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<string | null>(survivors[0]?.id || null);

  const handleRevive = () => {
    if (selectedRevivable && selectedDonor) {
      const success = revivePlayer(selectedRevivable, selectedDonor);
      if (success) {
        setSelectedRevivable(null);
      } else {
        alert("Insufficient tokens or invalid selection.");
      }
    }
  };

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-xs font-black tracking-[0.3em] text-purple-500 uppercase">Revive Phase</h2>
          <h1 className="text-4xl font-black italic">SQUAD RECOVERY</h1>
        </div>
        <button 
          onClick={() => setPhase('PHASE_2')}
          className="flex items-center gap-3 px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-slate-200 transition-all group"
        >
          CONTINUE TO PHASE 2
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Revive Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-3">
                <Heart size={18} className="text-red-500" />
                Select Squad Member to Revive
              </h3>
              <span className="text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded uppercase">Manual Approval Required</span>
            </div>
            
            <div className="p-6">
              {revivables.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {revivables.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedRevivable(p.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedRevivable === p.id 
                        ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/20' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-bold mb-1">{p.username}</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Tokens: {p.tokens.toFixed(1)}</span>
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 font-black rounded uppercase">Revivable</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 italic">
                  No squad members currently eligible for revival.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">The 3-Token Sacrifice</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Reviving a teammate costs <span className="text-white font-bold">3 personal tokens</span> from a Category A survivor. 
                  This deduction is permanent and will affect your ranking in Phase 2.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Choose Donor</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {survivors.map(p => (
                  <button
                    key={p.id}
                    disabled={p.tokens < 3}
                    onClick={() => setSelectedDonor(p.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedDonor === p.id 
                      ? 'bg-green-500/20 border-green-500 ring-2 ring-green-500/20' 
                      : p.tokens < 3 ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold">{p.username} {p.isReal && '(YOU)'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 font-black rounded uppercase">PASS</span>
                    </div>
                    <div className="text-xs font-black tabular-nums text-slate-300">
                      Balance: {p.tokens.toFixed(1)} 
                      <span className="text-red-400 ml-2">→ {(p.tokens - 3).toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!selectedRevivable || !selectedDonor}
              onClick={handleRevive}
              className="w-full mt-8 py-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white font-black text-xl rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
            >
              <UserPlus size={24} />
              AUTHORIZE REVIVAL
            </button>
          </div>
        </div>

        {/* RIGHT: Squad Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Squad Composition</h3>
            <div className="space-y-4">
              {squadMembers.map(p => (
                <div key={p.id} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    p.status === 'REVIVED' ? 'bg-purple-400' :
                    p.category === 'A' ? 'bg-green-500' :
                    p.category === 'B' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-grow">
                    <div className="text-sm font-bold">{p.username}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-black">
                      {p.status === 'REVIVED' ? 'Revived' : p.category === 'A' ? 'Passed' : p.category === 'B' ? 'At Risk' : 'Eliminated'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tabular-nums">{p.tokens.toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-red-400 font-bold">
              <AlertTriangle size={18} />
              PERMANENTLY ELIMINATED
            </div>
            {eliminated.length > 0 ? (
              <div className="space-y-3 opacity-60">
                {eliminated.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <span>{p.username}</span>
                    <span className="font-black tabular-nums">{p.tokens.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No members permanently eliminated in Phase 1.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviveDecisionScreen;
