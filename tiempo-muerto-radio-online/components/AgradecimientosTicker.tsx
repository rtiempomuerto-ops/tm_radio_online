
import React, { useState, useEffect } from 'react';
import { getRecentCommunityActivity, subscribeToCommunityActivity, CommunityActivity } from '../services/supabaseService';

const CommunityTicker: React.FC = () => {
  const [activities, setActivities] = useState<CommunityActivity[]>([]);

  useEffect(() => {
    const init = async () => {
      const data = await getRecentCommunityActivity();
      setActivities(data);
    };
    init();

    const channel = subscribeToCommunityActivity((newActivity) => {
      // Agregamos al principio para que aparezca "Breaking news"
      setActivities(prev => [newActivity, ...prev].slice(0, 20));
    });

    return () => { channel.unsubscribe(); };
  }, []);

  if (activities.length === 0) return null;

  const getActivityConfig = (item: CommunityActivity) => {
    switch (item.type) {
      case 'contribution':
        // CASO ESPECIAL: Mate Virtual
        if (item.detail === 'Mate Virtual') {
            return {
                icon: 'fa-mug-hot', // Icono de mate/bebida
                color: 'text-[#15803d]', // Verde oscuro
                bg: 'bg-[#affc41]', // Verde lima fluo
                label: 'RONDA DE MATES',
                text: `${item.user.toUpperCase()} ESTÁ COMPARTIENDO UNOS MATES EN LÍNEA`
            };
        }
        // Aportes monetarios normales
        return {
          icon: 'fa-heart',
          color: 'text-[#affc41]',
          bg: 'bg-red-600',
          label: 'NUEVO APORTE',
          text: `AGRADECEMOS A ${item.user.toUpperCase()} POR ${item.detail.toUpperCase()}`
        };
      case 'greeting':
        return {
          icon: 'fa-earth-americas',
          color: 'text-cyan-300',
          bg: 'bg-blue-600',
          label: 'SALUDO EN VIVO',
          text: `${item.user.toUpperCase()} DESDE ${item.subDetail?.toUpperCase() || 'ENTRE RÍOS'}: "${item.detail}"`
        };
      case 'request':
        return {
          icon: 'fa-music',
          color: 'text-purple-300',
          bg: 'bg-purple-600',
          label: 'PEDIDO MUSICAL',
          text: `SUENA PRONTO: "${item.detail.toUpperCase()}" ${item.subDetail ? `(${item.subDetail})` : ''}`
        };
      case 'report':
        return {
          icon: 'fa-camera',
          color: 'text-orange-300',
          bg: 'bg-orange-600',
          label: 'REPORTE VECINAL',
          text: `${item.user.toUpperCase()} INFORMA: "${item.detail.toUpperCase()}"`
        };
      default:
        return { icon: 'fa-circle', color: 'text-white', bg: 'bg-gray-500', label: 'INFO', text: item.detail };
    }
  };

  return (
    <div className="bg-slate-900 border-y-4 border-[#affc41] py-3 overflow-hidden whitespace-nowrap relative shadow-2xl z-20 rounded-xl my-2">
      <div className="flex animate-telex items-center">
        {/* Duplicamos el array varias veces para asegurar el loop infinito visual sin cortes */}
        {[...activities, ...activities, ...activities].map((item, i) => {
            const config = getActivityConfig(item);
            return (
              <div key={`${item.id}-${i}`} className="flex items-center mx-8">
                <div className={`flex items-center gap-2 px-3 py-1 rounded mr-3 ${config.bg} shadow-md`}>
                    <i className={`fas ${config.icon} ${config.color === 'text-[#15803d]' ? 'text-[#15803d]' : 'text-white'} text-[10px] animate-pulse`}></i>
                    <span className={`text-[9px] font-black ${config.color === 'text-[#15803d]' ? 'text-[#15803d]' : 'text-white'} uppercase tracking-widest`}>{config.label}</span>
                </div>
                
                <span className={`text-[12px] font-mono font-bold uppercase tracking-widest ${config.color}`}>
                  {config.text}
                </span>
                
                <span className="mx-6 text-slate-700 font-black">:::</span>
              </div>
            );
        })}
      </div>
      <style>{`
        @keyframes telex {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-telex {
          /* Velocidad aumentada: 50s es aprox 15% más rápido que 60s */
          animation: telex 50s linear infinite; 
        }
        /* Pausar al pasar el mouse para leer tranquilo */
        .animate-telex:hover {
            animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default CommunityTicker;
