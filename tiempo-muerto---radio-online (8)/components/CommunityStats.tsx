
import React, { useState, useEffect } from 'react';
import { getListenersCount } from '../services/radioBossService';
import { getGlobalMates, logMateAction, subscribeToGlobalStats } from '../services/supabaseService';
import { MateIcon } from './ContributionSection';

const CommunityStats: React.FC = () => {
  const [mates, setMates] = useState<number>(0);
  const [listeners, setListeners] = useState<number | '...'>('...');
  const [isSending, setIsSending] = useState(false);
  const [floatingIcons, setFloatingIcons] = useState<{id: number}[]>([]);
  const [userName, setUserName] = useState(localStorage.getItem('tiempo_muerto_user') || '');

  const refreshData = async () => {
    try {
      const lCount = await getListenersCount();
      setListeners(lCount);
      const mCount = await getGlobalMates();
      setMates(mCount);
    } catch (e) { 
      console.error("Error al refrescar datos comunitarios", e); 
    }
  };

  useEffect(() => {
    refreshData();
    const lInterval = setInterval(refreshData, 30000);
    
    // Suscripción Realtime para el contador de mates
    const mSub = subscribeToGlobalStats((newVal) => {
      setMates(newVal);
      // Disparamos efecto visual cuando otro usuario ceba un mate
      triggerFloatingIcon();
    });
    
    return () => { 
      clearInterval(lInterval); 
      mSub.unsubscribe(); 
    };
  }, []);

  const triggerFloatingIcon = () => {
    const id = Date.now();
    setFloatingIcons(prev => [...prev, { id }]);
    setTimeout(() => {
      setFloatingIcons(prev => prev.filter(icon => icon.id !== id));
    }, 2000);
  };

  const handleCebarMate = async () => {
    if (isSending) return;

    let currentName = userName.trim();
    if (!currentName) {
      const input = prompt("¡Venga ese mate! ¿Quién lo ceba? (Tu nombre)");
      if (!input || input.trim() === '') return;
      currentName = input.trim();
      setUserName(currentName);
      localStorage.setItem('tiempo_muerto_user', currentName);
    }

    setIsSending(true);
    triggerFloatingIcon(); // Efecto instantáneo para el usuario

    try {
      const newTotal = await logMateAction(currentName);
      setMates(newTotal);
    } catch (error) {
      console.error("Error al cebar mate:", error);
      alert("¡Se tapó la bombilla! Probá de nuevo en un ratito.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col transition-all">
      {/* SECCIÓN 1: OYENTES EN VIVO (DESTACADO) */}
      <div className="bg-slate-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em]">En el Aire</span>
        </div>

        <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter">
              {listeners}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oyentes</span>
        </div>
        
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-2 border-t border-white/5 pt-2 w-full text-center">
            Comunidad Tiempo Muerto Online
        </p>
      </div>

      {/* SECCIÓN 2: EL GRAN MATE COMUNITARIO */}
      <div className="p-8 space-y-6 relative bg-slate-50/50 dark:bg-slate-800/30">
        
        {/* El Contador de Mates */}
        <div className="text-center relative">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mates Cebados Hoy</span>
          <div className="flex items-center justify-center gap-3">
             <div className="bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-700">
                <span className="text-4xl font-black text-[#15803d] dark:text-[#affc41] tabular-nums">
                  {mates}
                </span>
             </div>
          </div>
          
          {/* Animación de iconos flotantes */}
          {floatingIcons.map(icon => (
            <div key={icon.id} className="absolute left-1/2 bottom-10 -translate-x-1/2 animate-float-up pointer-events-none">
                <div className="bg-[#affc41] p-2 rounded-full shadow-lg text-[#15803d]">
                    <MateIcon className="w-5 h-5" />
                </div>
            </div>
          ))}
        </div>

        {/* Botón de Acción Principal */}
        <button 
          onClick={handleCebarMate}
          disabled={isSending}
          className={`group relative w-full py-6 rounded-[2rem] bg-[#15803d] text-white shadow-xl hover:shadow-green-900/20 active:scale-95 transition-all overflow-hidden ${isSending ? 'cursor-wait' : ''}`}
        >
          {/* Brillo dinámico */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
          
          <div className="flex items-center justify-center gap-4 relative z-10">
            <div className={`p-3 bg-white/10 rounded-2xl ${isSending ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
               {isSending ? (
                 <i className="fas fa-circle-notch text-2xl"></i>
               ) : (
                 <MateIcon className="w-8 h-8 text-[#affc41]" />
               )}
            </div>
            
            <div className="text-left">
              <span className="block text-xs font-black uppercase tracking-widest leading-none">
                {isSending ? 'Sirviendo...' : '¡Cebar un Mate!'}
              </span>
              <span className="text-[9px] font-bold text-green-200 uppercase opacity-70">
                Sumate a la ronda
              </span>
            </div>
          </div>
        </button>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2">
            <i className="fas fa-circle text-[6px] text-green-500 animate-pulse"></i>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base de datos conectada en tiempo real</span>
        </div>
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1.5s ease-out forwards;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default CommunityStats;
