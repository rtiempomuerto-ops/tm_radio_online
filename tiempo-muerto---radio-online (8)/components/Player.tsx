
import React, { useState, useRef } from 'react';

interface PlayerProps {
  trackInfo: {
    title: string;
    art: string;
  };
  localData?: {
    current: { temp: number | string; humidity: string; wind: string; condition: string; feelsLike: number | string };
    river: { height: string; status: string };
    forecast: Array<{ day: string; icon: string; min: number | string; max: number | string }>;
  };
}

const Player: React.FC<PlayerProps> = ({ trackInfo, localData }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const streamUrl = "https://miestacion.turadioonline.com.ar/8024/stream";

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const getWeatherIconAndColor = (condition: string) => {
    const conditionLower = (condition || '').toLowerCase();
    if (conditionLower.includes('lluvi') || conditionLower.includes('llov') || conditionLower.includes('agua')) return { iconClass: 'fa-cloud-showers-heavy', colorClass: 'text-blue-400' };
    else if (conditionLower.includes('nub') || conditionLower.includes('cubiert')) return { iconClass: 'fa-cloud', colorClass: 'text-gray-400' };
    else if (conditionLower.includes('torment') || conditionLower.includes('elec')) return { iconClass: 'fa-bolt-lightning', colorClass: 'text-yellow-400' };
    else if (conditionLower.includes('niev')) return { iconClass: 'fa-snowflake', colorClass: 'text-cyan-200' };
    else if (conditionLower.includes('nieb') || conditionLower.includes('nebl')) return { iconClass: 'fa-smog', colorClass: 'text-gray-500' };
    else if (conditionLower.includes('parcial') || conditionLower.includes('algo')) return { iconClass: 'fa-cloud-sun', colorClass: 'text-orange-300' };
    else if (conditionLower.includes('soleado') || conditionLower.includes('despejado')) return { iconClass: 'fa-sun', colorClass: 'text-yellow-500' };
    return { iconClass: 'fa-cloud', colorClass: 'text-slate-400' };
  };

  const { iconClass: currentWeatherIcon, colorClass: currentWeatherColor } = getWeatherIconAndColor(localData?.current.condition || '');

  const parts = trackInfo.title.split(' - ');
  const displayArtist = (parts.length > 1 ? parts[0] : 'Tiempo Muerto').trim();
  const displayTitle = (parts.length > 1 ? parts[1] : trackInfo.title || 'Sintonizando...').trim();

  // Helper para generar el contenido del marquee (SOLO UNA INSTANCIA)
  const MarqueeContent = ({ text, className }: { text: string, className: string }) => (
    <div className="whitespace-nowrap animate-marquee absolute top-0 flex items-center">
      <span className={className}>{text}</span>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
      {/* Zona Radio */}
      <div className="flex flex-1 items-center gap-4 w-full bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden">
        <div style={{ 
          width: '75px', height: '75px', flexShrink: 0,
          borderRadius: '20px', 
          backgroundImage: `url(${trackInfo.art || 'https://via.placeholder.com/400?text=TM'})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          boxShadow: '0 6px 15px rgba(0,0,0,0.12)',
          border: '2px solid white'
        }} />

        <div className="flex-1 flex flex-col items-start justify-center gap-1 min-w-0 overflow-hidden">
          <div className="flex flex-col w-full text-left leading-tight">
            {/* Artist Marquee */}
            <div className="w-full overflow-hidden relative h-4 group mask-gradient">
               <MarqueeContent 
                 text={displayArtist} 
                 className="text-[9px] text-[#c1121f] font-black uppercase tracking-[0.2em]" 
               />
            </div>
            
            {/* Title Marquee */}
            <div className="w-full overflow-hidden relative h-6 mt-0.5 group mask-gradient">
               <MarqueeContent 
                 text={displayTitle} 
                 className="text-base text-[#2d6a4f] dark:text-green-400 font-black" 
               />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full mt-1.5">
            <button 
              onClick={togglePlay}
              className={`w-10 h-10 flex-shrink-0 rounded-xl border-none flex items-center justify-center text-white text-base cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${playing ? 'bg-[#c1121f]' : 'bg-[#2d6a4f]'}`}
            >
              <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} ml-0.5`}></i>
            </button>
            
            <div className="flex flex-col gap-1 flex-1">
              <span className={`text-[7px] font-black tracking-widest ${playing ? 'text-green-500 animate-pulse' : 'text-slate-400'}`}>
                 {playing ? '● EN VIVO' : '○ EN ESPERA'}
              </span>
              <div className="flex items-center gap-2">
                <i className="fas fa-volume-low text-slate-300 text-[8px]"></i>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  onChange={(e) => { if(audioRef.current) audioRef.current.volume = parseFloat(e.target.value) }}
                  className="w-full max-w-[100px] h-1 bg-slate-100 dark:bg-slate-800 accent-[#2d6a4f] rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zona Clima Compacto */}
      <div className="w-full xl:w-auto flex-shrink-0 bg-slate-900 text-white rounded-[2rem] p-4 md:min-w-[280px] shadow-xl border border-slate-800 flex flex-col justify-center">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
                <i className={`fas ${currentWeatherIcon} ${currentWeatherColor} text-lg`}></i>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black">{localData?.current.temp || '--'}°</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">CDU</span>
              </div>
           </div>
           <div className="text-right flex flex-col items-end">
              <span className="text-[7px] font-black text-blue-400 uppercase">Humedad</span>
              <span className="text-[10px] font-black">{localData?.current.humidity || '--'}</span>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
           {localData?.forecast?.slice(0,3).map((f, i) => (
             <div key={i} className="flex flex-col items-center justify-center bg-white/5 rounded-xl py-1.5 px-1">
                <span className="text-[6px] font-black text-slate-500 uppercase">{f.day}</span>
                <i className={`fas ${f.icon} text-[10px] my-1 text-blue-400`}></i>
                <div className="flex gap-1 text-[8px] font-black">
                   <span className="text-white">{f.max}°</span>
                   <span className="text-slate-500">{f.min}°</span>
                </div>
             </div>
           ))}
        </div>
      </div>
      <audio ref={audioRef} src={streamUrl} />
      <style>{`
         .mask-gradient {
           mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
           -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
         }
         @keyframes marquee {
           0% { left: 100%; transform: translateX(0); }
           100% { left: 0; transform: translateX(-100%); }
         }
         .animate-marquee {
           animation: marquee 12s linear infinite; /* Velocidad ajustada: más rápido */
           width: max-content;
           will-change: left, transform;
         }
         /* Pausar al hacer hover para poder leer si se desea */
         .group:hover .animate-marquee {
           animation-play-state: paused;
         }
      `}</style>
    </div>
  );
};

export default Player;
