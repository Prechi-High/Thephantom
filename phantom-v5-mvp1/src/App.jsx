import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { AnimatePresence } from 'framer-motion';
import Splash from './pages/Splash';
import Start from './pages/Start';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Transition from './pages/Transition';
import Results from './pages/Results';

function App() {
  const { view, tick } = useGameStore();

  useEffect(() => {
    console.log("Current Application View:", view);
  }, [view]);

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="min-h-screen bg-cyber-bg text-white font-mono selection:bg-cyber-purple/30 overflow-hidden relative">
      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(156,39,255,0.05),transparent_70%)] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {view === 'SPLASH' && <Splash key="splash" />}
        {view === 'START' && <Start key="start" />}
        {view === 'LOBBY' && <Lobby key="lobby" />}
        {view === 'GAME' && <Game key="game" />}
        {view === 'TRANSITION' && <Transition key="transition" />}
        {view === 'RESULTS' && <Results key="results" />}
      </AnimatePresence>
    </div>
  );
}

export default App;
