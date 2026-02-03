
import React, { useState, useEffect } from 'react';
import { getFullLocalData } from '../services/geminiService';

interface WeatherAndForecastCombinedProps {
  fullLocalData: {
    isFromCache?: boolean;
    lastUpdate?: number;
    error?: boolean;
    current: { 
      temp: number | string; 
      humidity: string; 
      wind: string; 
      condition: string; 
      feelsLike: number | string; 
      pressure: string; 
      uvIndex: number | string 
    };
    river: { height: string; status: string };
    forecast: Array<{ day: string; icon: string; min: number | string; max: number | string }>;
  } | null;
}

const WeatherAndForecastCombined: React.FC<WeatherAndForecastCombinedProps> = ({ fullLocalData }) => {
  const [weatherData, setWeatherData] = useState(fullLocalData || {
    isFromCache: false,
    current: { temp: '--', condition: 'Cargando...', humidity: '--', wind: '--', feelsLike: '--', pressure: '--', uvIndex: '--' },
    river: { height: '--', status: '--' },
    forecast: []
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date());

  // Efecto para el RELOJ en tiempo real (inmediato, sin esperar API)
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Efecto para actualizar datos del clima cuando cambian los props
  useEffect(() => {
    if (fullLocalData) {
      setWeatherData(fullLocalData);
    } else {
        refreshWeather(); // Fallback si llega null
    }
  }, [fullLocalData]);

  const refreshWeather = async () => {
    setIsUpdating(true);
    try {
      const newData = await getFullLocalData();
      if (newData) {
        setWeatherData(newData as any);
      }
    } catch (error) {
      console.error("Error auto-actualizando clima:", error);
    } finally {
      setTimeout(() => setIsUpdating(false), 1500);
    }
  };

  useEffect(() => {
    // CAMBIO: 60 MINUTOS (1 HORA)
    const intervalId = setInterval(refreshWeather, 60 * 60 * 1000); 
    return () => clearInterval(intervalId);
  }, []);

  const getWeatherIcon = (condition: string) => {
    const conditionLower = (condition || '').toLowerCase();
    if (conditionLower.includes('lluvi') || conditionLower.includes('llov') || conditionLower.includes('agua')) return 'fa-cloud-showers-heavy text-blue-500';
    if (conditionLower.includes('nub') || conditionLower.includes('cubiert')) return 'fa-cloud text-slate-500';
    if (conditionLower.includes('torment') || conditionLower.includes('elec')) return 'fa-bolt-lightning text-yellow-500';
    if (conditionLower.includes('parcial') || conditionLower.includes('algo')) return 'fa-cloud-sun text-orange-500';
    if (conditionLower.includes('soleado') || conditionLower.includes('despejado')) return 'fa-sun text-yellow-500';
    return 'fa-cloud text-slate-400';
  };

  const currentWeather = weatherData?.current || { 
    temp: '--', 
    feelsLike: '--', 
    condition: '...', 
    humidity: '--', 
    wind: '--', 
    pressure: '--', 
    uvIndex: '--' 
  };

  // Lógica de colores de encabezado (Verde = Vivo, Rojo = Caché/Error/Viejo)
  const isLiveData = !weatherData?.isFromCache && !weatherData?.error;
  const headerBgColor = isLiveData ? 'bg-[#15803d]' : 'bg-[#b91c1c]';
  const headerBorderColor = isLiveData ? 'border-green-800' : 'border-red-800';
  const badgeBgColor = isLiveData ? 'bg-green-800 text-[#affc41]' : 'bg-red-900 text-red-100';

  // Formato de hora local del sistema
  const displayTime = systemTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  // Componente de PASTILLA (Pill Widget) - VERSIÓN COMPACTA
  const StatPill = ({ icon, label, value, colorClass }: { icon: string, label: string, value: string | number, colorClass: string }) => (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-full flex items-center px-1.5 py-0.5 gap-2 shadow-sm h-full w-full">
      <div className={`w-6 h-6 rounded-full ${colorClass.replace('text-', 'bg-')}/15 flex items-center justify-center flex-shrink-0`}>
        <i className={`fas ${icon} ${colorClass} text-xs`}></i>
      </div>
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none mb-0.5 truncate">
            {label}
        </span>
        <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none truncate">
            {value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl h-full flex flex-col font-sans min-h-[350px]">
      
      {/* Header: Fuente y Hora */}
      <div className={`px-5 py-2.5 flex items-center justify-between border-b flex-shrink-0 ${headerBgColor} ${headerBorderColor} transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-0.5 rounded-full">
             <i className="fas fa-clock text-white text-[10px]"></i>
             <span className="text-[12px] font-black text-white tracking-widest">{displayTime}</span>
          </div>
          <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest hidden sm:inline flex items-center gap-1">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Microsoft_logo_%282012%29.svg/1024px-Microsoft_logo_%282012%29.svg.png" className="w-3 h-3 grayscale opacity-80" alt="MSN" />
             MSN WEATHER
          </span>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={refreshWeather}
                className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${badgeBgColor} hover:opacity-80 transition-opacity flex items-center gap-1`}
                disabled={isUpdating}
            >
                {isUpdating && <i className="fas fa-sync fa-spin"></i>}
                {isUpdating ? '...' : (isLiveData ? 'VIVO' : 'CACHÉ')}
            </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 gap-3 bg-white dark:bg-slate-900">
        
        {/* COL 1: Temperature Hero (TEXTO MÁS CHICO) */}
        <div className="w-full md:w-[40%] flex flex-col items-center justify-center bg-blue-50/50 dark:bg-slate-800/40 rounded-[1.5rem] border border-blue-100 dark:border-slate-700/50 p-2 relative overflow-hidden group hover:shadow-md transition-all">
             
             <div className="flex-1 flex flex-col items-center justify-center w-full mt-0">
                <i className={`fas ${getWeatherIcon(currentWeather.condition as string)} text-5xl md:text-6xl drop-shadow-sm mb-2 transform group-hover:scale-110 transition-transform`}></i>
                <div className="flex items-start leading-none -ml-2">
                    <span className="text-6xl md:text-7xl font-black text-slate-800 dark:text-white tracking-tighter">{currentWeather.temp}</span>
                    <span className="text-3xl font-black text-[#b91c1c] mt-2">°</span>
                </div>
             </div>
             
             <div className="w-full flex flex-col items-center gap-1 pb-1">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight text-center leading-tight bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm max-w-full truncate">
                    {currentWeather.condition}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">ST: {currentWeather.feelsLike}°</span>
             </div>
        </div>

        {/* COL 2: Pills Stats & River & Forecast */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
            {/* Grid de Pastillas */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <StatPill icon="fa-droplet" label="Humedad" value={currentWeather.humidity} colorClass="text-blue-500" />
                <StatPill icon="fa-wind" label="Viento" value={currentWeather.wind} colorClass="text-slate-500" />
                <StatPill icon="fa-gauge-high" label="Presión" value={currentWeather.pressure} colorClass="text-emerald-600" />
                <StatPill icon="fa-sun" label="Índice UV" value={currentWeather.uvIndex} colorClass="text-orange-500" />
            </div>
            
            {/* Forecast Row (COMPACTO) */}
            <div className="grid grid-cols-3 gap-2 flex-1 min-h-[60px]">
              {(weatherData?.forecast && weatherData.forecast.length > 0 ? weatherData.forecast.slice(0, 3) : [1,2,3]).map((f: any, i) => (
                <div key={i} className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-[1rem] border border-slate-100 dark:border-slate-800 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase leading-none mb-1">{f?.day?.substring(0,3) || '...'}</span>
                  <div className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-sm mb-1">
                      <i className={`fas ${getWeatherIcon(f?.day || '')} text-xs`}></i>
                  </div>
                  <div className="flex gap-1 text-[10px] font-black leading-none">
                    <span className="text-slate-900 dark:text-white">{f?.max || '-'}°</span>
                    <span className="text-slate-400 text-[9px]">{f?.min || '-'}°</span>
                  </div>
                </div>
              ))}
            </div>

            {/* River Section - Cápsula inferior (COMPACTA h-12) */}
            <div className="h-14 bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/20 border border-[#0ea5e9]/30 rounded-[1.2rem] flex items-center px-3 gap-2 relative overflow-hidden flex-shrink-0">
                 <div className="w-8 h-8 rounded-full bg-[#0ea5e9] flex items-center justify-center shadow-md flex-shrink-0 text-white">
                    <i className="fas fa-water text-sm"></i>
                 </div>
                 
                 <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-black text-[#0284c7] dark:text-[#38bdf8] uppercase tracking-widest">RÍO URUGUAY</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${weatherData?.river?.status?.includes('Sube') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                           {weatherData?.river?.status || '-'}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                            {weatherData?.river?.height || '--'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">MTS</span>
                    </div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default WeatherAndForecastCombined;
