import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'framer-motion';
import { Users, Clock, Wallet, ChevronRight } from 'lucide-react';

const Browser = () => {
  const startSession = useGameStore(state => state.startSession);

  const sessions = [
    { id: 1, players: '84/100', time: '02:45', fee: '$5.00', status: 'WAITING' },
    { id: 2, players: '99/100', time: '00:12', fee: '$5.00', status: 'FULL' },
    { id: 3, players: '12/100', time: '08:20', fee: '$5.00', status: 'WAITING' }
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">Active Subsections</h1>
        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Select a valid session node to deploy</p>
      </div>

      <div className="space-y-4">
        {sessions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-500 transition-all"
          >
            <div className="flex items-center gap-8">
              <div className="text-2xl font-black italic text-zinc-700 uppercase tracking-tighter">S-{s.id.toString().padStart(3, '0')}</div>
              
              <div className="flex gap-12">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <Users size={10} /> Players
                  </span>
                  <span className="text-lg font-black tabular-nums">{s.players}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <Clock size={10} /> Countdown
                  </span>
                  <span className="text-lg font-black tabular-nums text-yellow-500">{s.time}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase mb-1 flex items-center gap-1">
                    <Wallet size={10} /> Entry
                  </span>
                  <span className="text-lg font-black tabular-nums text-green-500">{s.fee}</span>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={s.status === 'FULL'}
              className={`mt-4 md:mt-0 px-8 py-3 rounded-xl font-black text-sm uppercase transition-all flex items-center gap-2 ${
                s.status === 'FULL' 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
              }`}
            >
              {s.status === 'FULL' ? 'SESSION FULL' : 'JOIN SESSION'}
              {s.status !== 'FULL' && <ChevronRight size={16} />}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-8 opacity-20">
         <div className="text-[10px] font-black uppercase tracking-[0.5em]">Network Scan Complete</div>
      </div>
    </div>
  );
};

export default Browser;
