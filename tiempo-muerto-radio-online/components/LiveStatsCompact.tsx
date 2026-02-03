
import React, { useState, useEffect } from 'react';
import { getListenersCount } from '../services/radioBossService';

const LiveStatsCompact: React.FC = () => {
  const [listeners, setListeners] = useState<number | '...'>('...');

  const refreshListeners = async () => {
    const count = await getListenersCount();
    setListeners(count);
  };

  useEffect(() => {
    refreshListeners();
    const interval = setInterval(refreshListeners, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
          {listeners === '...' ? 'SINTONIZANDO' : `${listeners} OYENTES`}
        </span>
      </div>
    </div>
  );
};

export default LiveStatsCompact;
