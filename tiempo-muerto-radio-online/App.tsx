
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import AIChatBot from './components/AIChatBot';
import Player from './components/Player';
import PodcastSection from './components/PodcastSection';
import NewsFeed from './components/NewsFeed';
import CommunityStats from './components/CommunityStats'; 
import BreakingNewsTicker from './components/BreakingNewsTicker';
import ContributionSection from './components/ContributionSection';
import LiveStatsCompact from './components/LiveStatsCompact';
import DonationPoster from './components/DonationPoster';
import RequestForm from './components/RequestForm';
import GreetingsWall from './components/GreetingsWall';
import CitizenReporterWidget from './components/CitizenReporterWidget';
import AdvertisingSection from './components/AdvertisingSection';
import PodcastUploadWidget from './components/PodcastUploadWidget';
import WeatherAndForecastCombined from './components/WeatherAndForecastCombined'; 
import CommunityTicker from './components/AgradecimientosTicker'; // Nuevo Componente
import { getSonicPanelData } from './services/radioBossService';
import { getFullLocalData } from './services/geminiService';

// --- LAYOUT DEL DASHBOARD (SOLO PARA INICIO) ---
const DashboardHome: React.FC<{ trackInfo: any, localData: any }> = ({ trackInfo, localData }) => {
  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in">
      
      {/* 1. COLUMNA IZQUIERDA: REMANSO + COLABORAR + COMUNIDAD */}
      <aside className="w-full xl:w-[380px] flex flex-col gap-6 flex-shrink-0 sticky top-4">
         {/* Remanso AI */}
         <div className="h-auto xl:h-[520px]">
            <AIChatBot />
         </div>
         
         {/* Debajo de Remanso: Colaborar */}
         <ContributionSection customTitle="Colaborar" />
         
         {/* Debajo de Colaborar: Comunidad Activa */}
         <CommunityStats />
      </aside>

      {/* 2. COLUMNA DERECHA: PLAYER + NOTICIAS/CLIMA + GRACIAS + PUBLICIDAD + WIDGETS */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
         
         {/* A. Player (Arriba a la derecha) */}
         <Player trackInfo={trackInfo} localData={localData} />

         {/* B. SECCIÓN DIVIDIDA: NOTICIAS (IZQ) | CLIMA (DER) */}
         {/* CAMBIO: Altura reducida a h-[380px] para que se vea más compacto */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[380px]">
            {/* Columna 1: Noticias (Modo Lista para rapidez) */}
            <div className="h-[380px] md:h-full">
               <NewsFeed 
                 title="Titulares de Hoy" 
                 mode="list" 
                 topic="Concepción del Uruguay" 
               />
            </div>

            {/* Columna 2: Clima Detallado (MSN Style) */}
            <div className="h-auto md:h-full">
               <WeatherAndForecastCombined fullLocalData={localData} />
            </div>
         </div>

         {/* C. Cartel de Gracias (Debajo de Noticias/Clima) */}
         <DonationPoster />

         {/* D. Espacio Publicitario MEDIO (3 botones: Anuncia Aquí) */}
         <AdvertisingSection slot="middle" />

         {/* E. Widgets Reordenados */}
         <div className="flex flex-col gap-6">
             
             {/* 1. Reportero y Saludos */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CitizenReporterWidget />
                <GreetingsWall />
             </div>

             {/* 2. PUBLICIDAD INFERIOR (3 espacios nuevos) */}
             <AdvertisingSection slot="bottom" />

             {/* === NUEVO: CINTA DE COMUNIDAD (TICKER) === */}
             {/* Ubicada estratégicamente entre Publicidad y Cabina/Podcasts */}
             <div className="w-full">
               <CommunityTicker />
             </div>

             {/* 3. FILA INFERIOR: CABINA DE PEDIDOS + SUBIDA DE PODCAST (50% / 50%) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cabina de Pedidos (Izquierda) */}
                <RequestForm />
                
                {/* Nueva sección de Subida de Podcast (Derecha) */}
                <PodcastUploadWidget />
             </div>
         </div>

      </div>

    </div>
  );
};

// --- LAYOUT PARA SUBPÁGINAS (NOTICIAS, DEPORTES, ETC) ---
interface UnifiedPageLayoutProps {
  title: string;
  children: React.ReactNode; 
  trackInfo: any;
  localData: any;
}

const UnifiedPageLayout: React.FC<UnifiedPageLayoutProps> = ({ title, children, trackInfo, localData }) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Player Compacto o Full */}
      <div className="w-full">
         <Player trackInfo={trackInfo} localData={localData} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
         
         {/* 1. CONTENIDO PRINCIPAL A LA IZQUIERDA */}
         <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
               <div className="w-2 h-8 bg-[#b91c1c] rounded-full"></div>
               <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                  {title}
               </h2>
            </div>
            {children}
         </div>

         {/* 2. SIDEBAR A LA DERECHA (Remanso + Colaborar + Comunidad) */}
         <aside className="w-full lg:w-[360px] flex flex-col gap-5 flex-shrink-0 sticky top-4">
            <AIChatBot />
            <ContributionSection customTitle="Colaborar" />
            <CommunityStats />
         </aside>

      </div>
    </div>
  );
};


const Layout: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [trackInfo, setTrackInfo] = useState({ title: 'Cargando sintonía...', art: '' });
  const [localData, setLocalData] = useState<any>(null); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateTrack = async () => {
      const data = await getSonicPanelData();
      setTrackInfo({ title: data.songTitle, art: data.art });
    };
    
    const updateLocalData = async () => {
      const data = await getFullLocalData();
      if (data) setLocalData(data);
    };

    updateTrack();
    updateLocalData(); 

    const trackInterval = setInterval(updateTrack, 45000); 
    const weatherInterval = setInterval(updateLocalData, 1000 * 60 * 60); 

    return () => {
        clearInterval(trackInterval);
        clearInterval(weatherInterval);
    };
  }, []);

  const theme = {
    bg: darkMode ? '#0f172a' : '#f1f5f9',
    card: darkMode ? '#1e293b' : '#ffffff',
    verdeLima: '#affc41',
    rojoFederal: '#b91c1c',
    grisOscuro: '#1e293b'
  };

  const navItems = [
    { id: 'home', label: 'Inicio', icon: 'fa-home', path: '/', activeClass: 'bg-slate-800 text-white shadow-lg scale-105', inactiveClass: 'bg-white text-slate-600 hover:bg-slate-100' },
    { id: 'local', label: 'Locales', icon: 'fa-location-dot', path: '/locales', activeClass: 'bg-blue-100 border-blue-300 text-blue-800 shadow-md', inactiveClass: 'bg-blue-50 text-blue-400 hover:bg-blue-100' },
    { id: 'regional', label: 'Regionales', icon: 'fa-map', path: '/regionales', activeClass: 'bg-purple-100 border-purple-300 text-purple-800 shadow-md', inactiveClass: 'bg-purple-50 text-purple-400 hover:bg-purple-100' },
    { id: 'national', label: 'Nacionales', icon: 'fa-earth-americas', path: '/nacionales', activeClass: 'bg-orange-100 border-orange-300 text-orange-800 shadow-md', inactiveClass: 'bg-orange-50 text-orange-400 hover:bg-orange-100' },
    { id: 'sports', label: 'Deportes', icon: 'fa-futbol', path: '/deportes', activeClass: 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-md', inactiveClass: 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100' },
    { id: 'auto', label: 'Autódromo', icon: 'fa-flag-checkered', path: '/autodromo', activeClass: 'bg-red-100 border-red-300 text-red-800 shadow-md', inactiveClass: 'bg-red-50 text-red-400 hover:bg-red-100' },
    { id: 'podcasts', label: 'Podcasts', icon: 'fa-headphones', path: '/podcasts', activeClass: 'bg-slate-200 border-slate-400 text-slate-800 shadow-md', inactiveClass: 'bg-slate-100 text-slate-400 hover:bg-slate-200' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: darkMode ? '#f1f5f9' : '#1e293b', transition: 'background-color 0.3s' }}>
      
      {/* Top Bar */}
      <div style={{ backgroundColor: theme.grisOscuro, padding: '10px 0', fontSize: '11px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-4">
             <LiveStatsCompact />
             <span className="font-black tracking-[0.2em] uppercase hidden md:inline">● RADIO TIEMPO MUERTO | {localData?.current?.temp || '--'}°C | CDU ONLINE</span>
          </div>
          <span onClick={() => setDarkMode(!darkMode)} className="cursor-pointer font-black bg-white/10 px-4 py-1.5 rounded-full hover:bg-white/20 transition-all text-[10px]">
            {darkMode ? '☀️ MODO DÍA' : '🌙 MODO NOCHE'}
          </span>
        </div>
      </div>

      {/* Header */}
      <header style={{ backgroundColor: theme.card, padding: '15px 0', borderBottom: `6px solid ${theme.rojoFederal}`, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1400px', width: '95%', margin: '0 auto' }}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 xl:gap-8">
            {/* Logo */}
            <div className="flex items-center justify-between xl:justify-start gap-8 w-full xl:w-auto flex-shrink-0">
                <NavLink to="/" className="flex items-center gap-4 no-underline">
                  <div style={{ backgroundColor: theme.rojoFederal, color: theme.verdeLima, padding: '12px 18px', borderRadius: '18px', fontWeight: '900', fontSize: '28px', boxShadow: `0 6px 20px ${theme.rojoFederal}44` }}>TM</div>
                  <div className="flex flex-col">
                      <h1 style={{ margin: 0, fontSize: '32px', color: '#064e3b', fontWeight: '900', letterSpacing: '-0.07em', lineHeight: '0.8' }}>TIEMPO MUERTO</h1>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: theme.rojoFederal, letterSpacing: '0.35em', marginTop: '2px' }}>RADIO ONLINE</span>
                  </div>
                </NavLink>
            </div>

            {/* Nav */}
            <div className="flex-1 w-full xl:w-auto overflow-x-auto hide-scrollbar flex items-center xl:justify-end gap-2 xl:px-4">
               {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button key={item.id} onClick={() => navigate(item.path)} className={`px-4 py-2.5 rounded-xl text-[10px] xl:text-[11px] font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${isActive ? item.activeClass : item.inactiveClass}`}>
                      <i className={`fas ${item.icon} text-sm`}></i>
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </header>

      <BreakingNewsTicker />

      <main className="max-w-[1400px] w-[95%] mx-auto py-6">
          <Routes>
            {/* 1. HOME: DASHBOARD REORGANIZADO */}
            <Route path="/" element={<DashboardHome trackInfo={trackInfo} localData={localData} />} />

            {/* 2. SUBPÁGINAS: CONTENIDO IZQ, SIDEBAR DER */}
            <Route path="/locales" element={
               <UnifiedPageLayout title="Noticias Locales" trackInfo={trackInfo} localData={localData}>
                  <NewsFeed topic="Concepción del Uruguay" mode="grid" title="Actualidad Local" />
               </UnifiedPageLayout>
            } />
            
            <Route path="/regionales" element={
               <UnifiedPageLayout title="Noticias Regionales" trackInfo={trackInfo} localData={localData}>
                  <NewsFeed topic="Entre Ríos Actualidad" mode="grid" title="Panorama Regional" />
               </UnifiedPageLayout>
            } />

            <Route path="/nacionales" element={
               <UnifiedPageLayout title="Noticias Nacionales" trackInfo={trackInfo} localData={localData}>
                  <NewsFeed topic="Argentina Noticias" mode="grid" title="Panorama Nacional" />
               </UnifiedPageLayout>
            } />

            <Route path="/deportes" element={
               <UnifiedPageLayout title="Deportes Locales" trackInfo={trackInfo} localData={localData}>
                  <NewsFeed topic="deportes" mode="grid" title="Actualidad Deportiva" />
               </UnifiedPageLayout>
            } />

            <Route path="/autodromo" element={
               <UnifiedPageLayout title="Fierros y Autódromo" trackInfo={trackInfo} localData={localData}>
                  <NewsFeed topic="autodromo" mode="grid" title="Mundo Motor" />
               </UnifiedPageLayout>
            } />

            <Route path="/podcasts" element={
               <UnifiedPageLayout title="Espacio Podcast" trackInfo={trackInfo} localData={localData}>
                  <PodcastSection />
               </UnifiedPageLayout>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </main>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => (<HashRouter><Layout /></HashRouter>);
export default App;
