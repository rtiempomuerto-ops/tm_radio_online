
import React, { useEffect, useState } from 'react';

const AnalogClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsDegrees = (time.getSeconds() / 60) * 360;
  const minutesDegrees = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hoursDegrees = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  // Números romanos para el dial
  const numerals = [
    { num: 'XII', deg: 0 },
    { num: 'I', deg: 30 },
    { num: 'II', deg: 60 },
    { num: 'III', deg: 90 },
    { num: 'IV', deg: 120 },
    { num: 'V', deg: 150 },
    { num: 'VI', deg: 180 },
    { num: 'VII', deg: 210 },
    { num: 'VIII', deg: 240 },
    { num: 'IX', deg: 270 },
    { num: 'X', deg: 300 },
    { num: 'XI', deg: 330 }
  ];

  return (
    <div className="hidden xl:flex items-center justify-center relative w-[60px] h-[60px] bg-[#f8fafc] dark:bg-slate-800 rounded-full border-[4px] border-[#e2e8f0] dark:border-slate-700 shadow-lg flex-shrink-0 group hover:scale-105 transition-transform duration-500 cursor-default">
      
      {/* Sombra interna para profundidad */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_5px_rgba(0,0,0,0.1)]"></div>

      {/* Números Romanos */}
      {numerals.map((item, index) => {
        // Ajuste fino para tamaño 60px
        const radius = 21; 
        const angleRad = (item.deg - 90) * (Math.PI / 180);
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        return (
          <div 
            key={index} 
            className="absolute text-[6px] font-black text-slate-500 dark:text-slate-400 font-serif leading-none"
            style={{ 
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {item.num}
          </div>
        );
      })}

      {/* Manecilla Hora */}
      <div 
        className="absolute w-1 h-4 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom bottom-1/2 z-10 shadow-sm" 
        style={{ transform: `rotate(${hoursDegrees}deg)` }} 
      >
        <div className="absolute -top-0.5 left-0 w-1 h-1 bg-slate-800 dark:bg-slate-200 rounded-full"></div>
      </div>
      
      {/* Manecilla Minuto */}
      <div 
        className="absolute w-0.5 h-6 bg-slate-600 dark:bg-slate-400 rounded-full origin-bottom bottom-1/2 z-20 shadow-sm" 
        style={{ transform: `rotate(${minutesDegrees}deg)` }} 
      />
      
      {/* Manecilla Segundo */}
      <div 
        className="absolute w-[1px] h-7 bg-[#b91c1c] rounded-full origin-bottom bottom-1/2 z-30" 
        style={{ transform: `rotate(${secondsDegrees}deg)` }} 
      >
        <div className="absolute bottom-[-4px] left-[-1px] w-0.5 h-2 bg-[#b91c1c] rounded-full"></div>
      </div>
      
      {/* Centro (Hub) */}
      <div className="absolute w-2 h-2 bg-[#b91c1c] rounded-full border border-white dark:border-slate-900 z-40 shadow-md" />
    </div>
  );
};

export default AnalogClock;
