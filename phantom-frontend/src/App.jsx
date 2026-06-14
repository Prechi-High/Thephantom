import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { AnimatePresence } from 'framer-motion';
import Splash from './pages/Splash';
import Lobby from './pages/Lobby';
import Browser from './pages/Browser';
import Session from './pages/Session';
import Transition from './pages/Transition';
import Report from './pages/Report';

function App() {
  const { view, tick, initSimulation } = useGameStore();

  // Engine Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000); // 1s tick
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="min-h-screen bg-cyber-dark text-zinc-100 font-mono selection:bg-cyber-purple/30 overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'SPLASH' && <Splash key="splash" />}
        {view === 'START' && <Lobby key="lobby" />}
        {view === 'BROWSER' && <Browser key="browser" />}
        {view === 'SESSION' && <Session key="session" />}
        {view === 'REPORT' && <Report key="report" />}
      </AnimatePresence>
      
      {/* Overlay Screens */}
      <AnimatePresence>
        {view === 'TRANSITION' && <Transition key="transition" />}
      </AnimatePresence>
    </div>
  );
}

export default App;
