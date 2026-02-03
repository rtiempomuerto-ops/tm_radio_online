
import React, { useState, useEffect } from 'react';
import { getRecentContributions, subscribeToContributions } from '../services/supabaseService';
import { MateIcon } from './ContributionSection';

const DonationPoster: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Configuración: Tiempo de rotación y ventana de antigüedad (24 horas)
  const ROTATION_INTERVAL_MS = 6000;
  const HOURS_WINDOW = 24;

  useEffect(() => {
    const fetchLatest = async () => {
      const data = await getRecentContributions();
      
      // Filtramos solo las donaciones de las últimas 24 horas
      const now = Date.now();
      const cutoff = now - (HOURS_WINDOW * 60 * 60 * 1000);
      
      const recentDonations = (data || []).filter((item: any) => {
        const itemTime = new Date(item.created_at).getTime();
        return itemTime > cutoff;
      });

      setQueue(recentDonations);
    };

    fetchLatest();

    // Suscripción a nuevas donaciones (Realtime)
    const sub = subscribeToContributions((payload) => {
      // Cuando entra una nueva, la ponemos primera y forzamos su visualización inmediata
      setQueue(prev => [payload, ...prev]);
      setCurrentIndex(0);
      setIsVisible(true);
    });

    return () => { sub.unsubscribe(); };
  }, []);

  // Lógica de Rotación (Carrusel)
  useEffect(() => {
    if (queue.length <= 1) return; // No rotar si hay 0 o 1 elemento

    const interval = setInterval(() => {
      setIsVisible(false); // Efecto fade-out
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % queue.length);
        setIsVisible(true); // Efecto fade-in
      }, 500); // Esperar medio segundo para cambiar el contenido
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [queue.length]);

  // Si no hay donaciones recientes (últimas 24h), no mostramos nada
  if (queue.length === 0) return null;

  const donation = queue[currentIndex];

  const getConfig = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('yerba') || t.includes('mate') || t.includes('socio')) return {
        text: 'UNOS BUENOS MATES',
        sub: 'El combustible de la radio',
        icon: <MateIcon className="w-8 h-8 md:w-12 md:h-12 text-[#064e3b]" />,
        bg: 'bg-[#ecfccb]',
        border: 'border-[#bef264]',
        textCol: 'text-[#365314]',
    };
    if (t.includes('bizcoch')) return {
        text: 'MATE CON BIZCOCHOS',
        sub: 'Pa\' engañar el estómago',
        icon: <i className="fas fa-cookie-bite text-2xl md:text-4xl text-amber-700"></i>,
        bg: 'bg-[#ffedd5]',
        border: 'border-[#fed7aa]',
        textCol: 'text-[#7c2d12]',
    };
    if (t.includes('gaseosa')) return {
        text: 'UNA GASEOSA FRESCA',
        sub: 'Para bajar la temperatura',
        icon: <i className="fas fa-bottle-water text-2xl md:text-4xl text-blue-600"></i>,
        bg: 'bg-[#dbeafe]',
        border: 'border-[#bfdbfe]',
        textCol: 'text-[#1e3a8a]',
    };
    if (t.includes('combo') || t.includes('sandwich') || t.includes('sándwich')) return {
        text: 'SÁNDWICH Y GASEOSA',
        sub: 'Almuerzo completo',
        icon: <i className="fas fa-burger text-2xl md:text-4xl text-orange-600"></i>,
        bg: 'bg-[#ffedd5]',
        border: 'border-[#fdba74]',
        textCol: 'text-[#9a3412]',
    };
    // Default
    return {
        text: 'UNA GRAN GAUCHADA',
        sub: 'Aporte a la gorra',
        icon: <i className="fas fa-heart text-2xl md:text-4xl text-red-600"></i>,
        bg: 'bg-[#fee2e2]',
        border: 'border-[#fecaca]',
        textCol: 'text-[#991b1b]',
    };
  };

  const config = getConfig(donation.item_type);

  // Calculamos hace cuánto fue
  const minutesAgo = Math.floor((Date.now() - new Date(donation.created_at).getTime()) / 60000);
  const timeLabel = minutesAgo < 1 ? 'AHORA' : minutesAgo < 60 ? `HACE ${minutesAgo} MIN` : `HACE ${Math.floor(minutesAgo/60)} HS`;

  return (
    <div className={`w-full rounded-[2rem] md:rounded-[2.5rem] border-4 ${config.border} ${config.bg} p-4 md:p-6 shadow-xl relative overflow-hidden transition-all duration-500 hover:scale-[1.01] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Giant Icon Background */}
        <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 scale-150 pointer-events-none">
             <div className="text-[100px] md:text-[150px] leading-none text-current">
                {config.icon.props.className.includes('fa-') ? <i className={config.icon.props.className.replace(/text-\d+xl/g, '')}></i> : config.icon}
             </div>
        </div>

        {/* Indicador de paginación (si hay más de una donación) */}
        {queue.length > 1 && (
           <div className="absolute top-2 right-4 md:top-4 flex gap-1">
             {queue.map((_, idx) => (
               <div key={idx} className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full transition-all ${idx === currentIndex ? `bg-current scale-125 ${config.textCol}` : 'bg-slate-400/30'}`}></div>
             ))}
           </div>
        )}

        <div className="flex flex-row items-center gap-4 md:gap-6 relative z-10">
            
            {/* Badge Icon (Más chico en móvil) */}
            <div className={`w-14 h-14 md:w-20 md:h-20 flex-shrink-0 rounded-[1rem] md:rounded-[1.5rem] bg-white flex items-center justify-center shadow-lg border-2 ${config.border} ${minutesAgo < 5 ? 'animate-bounce' : ''}`}>
                {config.icon}
            </div>

            {/* Text Content */}
            <div className="flex-1 text-left min-w-0">
                <div className={`inline-flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/60 backdrop-blur-sm mb-1 border ${config.border}`}>
                    <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] ${config.textCol}`}>
                        ★ NUEVO
                    </span>
                    <span className="w-px h-2 bg-current opacity-20"></span>
                    <span className={`text-[7px] md:text-[8px] font-bold uppercase tracking-widest ${config.textCol}`}>
                        {timeLabel}
                    </span>
                </div>
                
                <h3 className={`text-lg md:text-3xl font-black uppercase leading-tight ${config.textCol} mb-0.5 md:mb-2 tracking-tight truncate`}>
                    ¡GRACIAS, {donation.user_name}!
                </h3>
                
                <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2 leading-none md:leading-normal">
                    <span className={`text-[9px] md:text-[11px] font-bold uppercase tracking-widest ${config.textCol} opacity-80 truncate`}>
                       POR INVITAR {config.text}
                    </span>
                    <span className="hidden md:inline w-1 h-1 rounded-full bg-current opacity-40"></span>
                    <span className={`text-[8px] md:text-[10px] font-black italic opacity-60 ${config.textCol} hidden sm:inline`}>
                        "{config.sub}"
                    </span>
                </div>
            </div>

            {/* Price Tag Effect (Solo visible en Desktop para ahorrar espacio) */}
            <div className={`hidden lg:flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-dashed ${config.border} ${config.textCol} opacity-30 transform rotate-12`}>
                <span className="text-[10px] font-black uppercase">GRACIAS</span>
                <i className="fas fa-smile text-2xl mt-1"></i>
            </div>
        </div>
    </div>
  );
};

export default DonationPoster;
