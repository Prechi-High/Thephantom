import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Layers, Target, Users, Shield } from 'lucide-react';

const NavItem = ({ id, icon: Icon, label, active, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 w-16"
  >
    <div className={`relative ${active ? 'text-[#E8A020]' : 'text-[#E8E8F0]/30'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      {active && <motion.div layoutId="nav-pill" className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#E8A020]" />}
    </div>
    <span className={`text-[10px] font-black uppercase ${active ? 'text-[#E8A020]' : 'text-[#E8E8F0]/30'}`}>
      {label}
    </span>
  </motion.button>
);

const BottomNavigation = () => {
  const { view, setView, phase, isRunning } = useGameStore();

  // Locked state exceptions
  const isLocked = ['SPIN', 'STEAL', 'RESOLUTION', 'DUEL', 'DEATH'].includes(phase) || !isRunning;
  if (isLocked) return null;

  const items = [
    { id: 'HOME', icon: Ghost, label: 'Home' },
    { id: 'SESSIONS', icon: Layers, label: 'Sessions' },
    { id: 'ARENA', icon: Target, label: 'Arena' },
    { id: 'SYNDICATE', icon: Users, label: 'Syndicate' },
    { id: 'DOSSIER', icon: Shield, label: 'Dossier' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-around items-center z-[90]">
      {items.map((item) => (
        <NavItem 
          key={item.id} 
          {...item} 
          active={view === item.id} 
          onClick={() => setView(item.id)}
        />
      ))}
    </div>
  );
};

export default BottomNavigation;
