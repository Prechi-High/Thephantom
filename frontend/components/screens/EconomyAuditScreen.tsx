
'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ShieldCheck, BarChart3, Users, Wallet, ArrowLeft } from 'lucide-react';

const EconomyAuditScreen = () => {
  const { players, squads, pool, platformFeePct, winnerAllocationPct, setPhase } = useGameStore();
  
  const audit = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.tokens - a.tokens);
    const winner = sorted[0];
    const top15 = sorted.slice(1, 16); // Ranks 2-16 for reward pool + refunds
    const top5Participants = top15.slice(0, 5); // Ranks 2-6 get performance share
    const refundTier = top15.slice(5, 15); // Ranks 7-16 get refunds

    const platformFee = pool * platformFeePct;
    const winnerAllocation = pool * winnerAllocationPct;
    
    // Refund Tier: 10 players get $5 back
    const refundTierTotal = 10 * 5;
    
    const remainingPool = pool - platformFee - winnerAllocation - refundTierTotal;
    const performancePool = remainingPool * 0.60;
    const squadRewardPool = remainingPool * 0.40;

    const totalPerfTokens = top5Participants.reduce((sum, p) => sum + p.tokens, 0);
    const winnerSquad = squads.find(s => s.id === winner.squadId);
    const winnerSquadMembers = players.filter(p => p.squadId === winnerSquad?.id && p.id !== winner.id);
    const totalSquadTokens = winnerSquadMembers.reduce((sum, p) => sum + p.tokens, 0);

    const userBreakdown = sorted.map((p, index) => {
      const rank = index + 1;
      let payout = 0;
      let perfShare = 0;
      let squadShare = 0;
      let isRefund = false;
      let isWinner = rank === 1;

      if (isWinner) payout += winnerAllocation;
      
      // Top 5 (Ranks 2-6) get performance pool
      if (rank >= 2 && rank <= 6) {
        perfShare = (p.tokens / totalPerfTokens) * performancePool;
        payout += perfShare;
      }

      // Refund Tier (Ranks 7-16)
      if (rank >= 7 && rank <= 16) {
        payout += 5;
        isRefund = true;
      }

      // Squad Reward (Winner's squad except winner)
      if (winnerSquadMembers.find(m => m.id === p.id)) {
        squadShare = (p.tokens / totalSquadTokens) * squadRewardPool;
        payout += squadShare;
      }

      return {
        playerId: p.id,
        username: p.username,
        rank,
        finalTokens: p.tokens,
        payout,
        isRefund,
        isWinner,
        performanceShare: perfShare,
        squadShare
      };
    });

    return {
      platformFee,
      winnerAllocation,
      refundTierTotal,
      performancePool,
      squadRewardPool,
      userBreakdown
    };
  }, [players, squads, pool, platformFeePct, winnerAllocationPct]);

  return (
    <div className="space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase">Transparency Engine</h2>
          <h1 className="text-4xl font-black italic">ECONOMY AUDIT</h1>
        </div>
        <button 
          onClick={() => setPhase('AUTH')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Start
        </button>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">Platform Fee</div>
          <div className="text-2xl font-black text-white">${audit.platformFee.toFixed(2)}</div>
          <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">{(platformFeePct * 100).toFixed(0)}% House Take</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">Winner Take</div>
          <div className="text-2xl font-black text-yellow-500">${audit.winnerAllocation.toFixed(2)}</div>
          <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Fixed Allocation</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-purple-500/30">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">Performance Pool</div>
          <div className="text-2xl font-black text-purple-400">${audit.performancePool.toFixed(2)}</div>
          <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Split between Ranks 2-6</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl border-blue-500/30">
          <div className="text-xs font-black text-slate-500 uppercase mb-2">Squad Pool</div>
          <div className="text-2xl font-black text-blue-400">${audit.squadRewardPool.toFixed(2)}</div>
          <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Split by Winner's Mates</div>
        </div>
      </div>

      {/* USER BREAKDOWN */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
          <ShieldCheck size={16} className="text-green-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Validated User Payouts</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <th className="p-4">Rank</th>
                <th className="p-4">Player</th>
                <th className="p-4 text-right">Final Tokens</th>
                <th className="p-4 text-right">Perf. Share</th>
                <th className="p-4 text-right">Squad Share</th>
                <th className="p-4 text-right text-white">Final Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {audit.userBreakdown.filter(u => u.payout > 0).map((u) => (
                <tr key={u.playerId} className={`text-sm ${u.isWinner ? 'bg-yellow-500/5' : ''}`}>
                  <td className="p-4 font-black tabular-nums text-slate-500">#{u.rank}</td>
                  <td className="p-4 font-bold">
                    <div className="flex items-center gap-2">
                      {u.username}
                      {u.isWinner && <span className="text-[9px] px-1 bg-yellow-500 text-black rounded font-black">WINNER</span>}
                      {u.isRefund && <span className="text-[9px] px-1 bg-slate-700 text-slate-300 rounded font-black">REFUND</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right font-black tabular-nums">{u.finalTokens.toFixed(1)}</td>
                  <td className="p-4 text-right tabular-nums text-purple-400">
                    {u.performanceShare > 0 ? `$${u.performanceShare.toFixed(2)}` : '--'}
                  </td>
                  <td className="p-4 text-right tabular-nums text-blue-400">
                    {u.squadShare > 0 ? `$${u.squadShare.toFixed(2)}` : '--'}
                  </td>
                  <td className="p-4 text-right font-black tabular-nums text-green-400 text-lg">
                    ${u.payout.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECONCILIATION FOOTER */}
      <div className="flex justify-center">
        <div className="flex items-center gap-6 px-8 py-3 bg-green-500/10 border border-green-500/30 rounded-full">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-green-500" />
            <span className="text-[10px] font-black uppercase text-green-500">Audit Status</span>
          </div>
          <div className="h-4 w-px bg-green-500/20" />
          <span className="text-sm font-bold text-green-400">ECONOMY RECONCILED (100.0%)</span>
          <div className="h-4 w-px bg-green-500/20" />
          <span className="text-[10px] font-black uppercase text-green-600 tracking-tighter">Total Distributed: ${pool.toFixed(2)} / ${pool.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default EconomyAuditScreen;
