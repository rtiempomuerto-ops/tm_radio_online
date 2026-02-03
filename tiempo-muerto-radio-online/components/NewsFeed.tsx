
import React, { useState, useEffect, useRef } from 'react';
import { getLocalNews } from '../services/geminiService';
import { NewsItem } from '../types';

interface NewsFeedProps {
  categoryFilter?: 'local' | 'community';
  topic?: string; 
  title?: string;
  mode?: 'carousel' | 'list' | 'grid';
}

// --- RENDERIZADO DE TARJETA INDIVIDUAL ---
const NewsCard: React.FC<{ item: NewsItem, layout: 'card' | 'row' | 'grid' }> = ({ item, layout }) => {
  const isRow = layout === 'row';
  const isGrid = layout === 'grid';
  
  return (
    <div className={`
      relative group transition-all duration-300 overflow-hidden
      ${isRow 
        ? 'flex gap-3 items-start p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50' 
        : isGrid
          ? 'bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col hover:shadow-xl hover:-translate-y-1 h-full'
          : 'flex-shrink-0 w-[280px] md:w-[320px] bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col hover:shadow-xl hover:-translate-y-1'
      }
    `}>
      {/* Fuente / Badge */}
      <div className={`flex justify-between items-start ${isRow ? 'order-2 w-20 flex-col items-end' : 'mb-3'}`}>
         <span className="text-[7px] font-black bg-[#c1121f] text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm truncate max-w-full">
           {item.source || 'Local'}
         </span>
         {!isRow && (
           <span className="text-[9px] font-bold text-slate-400">{item.timestamp as string}</span>
         )}
      </div>

      {/* Contenido */}
      <div className={`flex-1 ${isRow ? 'order-1' : ''}`}>
         <h3 className={`font-black text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-[#064e3b] dark:group-hover:text-[#affc41] transition-colors ${isRow ? 'text-sm' : 'text-base md:text-lg'}`}>
           <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-2 underline-offset-2">
             {item.title}
           </a>
         </h3>
         <p className={`text-slate-500 dark:text-slate-400 font-medium leading-relaxed ${isRow ? 'text-[10px] line-clamp-2' : 'text-[11px] line-clamp-3'}`}>
           {item.excerpt}
         </p>
         
         {/* Footer en Card/Grid */}
         {!isRow && (
           <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-[#c1121f] hover:border-[#c1121f] transition-all">
                <i className="fas fa-external-link-alt text-[10px]"></i>
              </a>
           </div>
         )}
         
         {/* Footer en Row */}
         {isRow && (
           <div className="mt-1">
              <span className="text-[8px] font-bold text-slate-400">{item.timestamp as string}</span>
           </div>
         )}
      </div>
    </div>
  );
};

const NewsFeed: React.FC<NewsFeedProps> = ({ categoryFilter, topic = 'general', title, mode = 'carousel' }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchNewsData = async (isBackground: boolean) => {
    if (!isBackground && newsItems.length === 0) setIsLoading(true);
    if (isBackground) setIsRefreshing(true);
    setError(false);

    try {
      const news = await getLocalNews(topic);
      if (news === null) {
        setError(true);
      } else if (news.length > 0) {
        setNewsItems(news);
      }
    } catch (error) {
      console.error("Error actualizando noticias:", error);
      setError(true);
    } finally {
      setIsLoading(false);
      if (isBackground) setTimeout(() => setIsRefreshing(false), 2500);
    }
  };

  useEffect(() => {
    fetchNewsData(false);
    // CAMBIO: Actualización cada 1 HORA (60 mins) para ahorrar cuota
    const updateInterval = setInterval(() => fetchNewsData(true), 1000 * 60 * 60);
    return () => clearInterval(updateInterval);
  }, [topic]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-10">
      <i className="fas fa-newspaper text-4xl mb-2 text-slate-300"></i>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin novedades por el momento</p>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <i className="fas fa-wifi text-4xl mb-2 text-red-300"></i>
      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Error de conexión</p>
      <button onClick={() => fetchNewsData(false)} className="mt-3 px-4 py-2 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase hover:bg-red-100 transition-colors">
        Reintentar
      </button>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
      <div className="w-6 h-6 border-4 border-[#064e3b] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buscando en portales locales...</p>
    </div>
  );

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border transition-all duration-700 h-full flex flex-col ${
      isRefreshing 
        ? 'border-[#affc41] shadow-[0_0_20px_rgba(175,252,65,0.3)]' 
        : 'border-slate-100 dark:border-slate-800'
    }`}>
      {/* Header Fijo */}
      <div className="bg-[#064e3b] p-3 flex items-center justify-between border-b border-green-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-green-400">
            <i className={`fas fa-newspaper text-xs ${isRefreshing ? 'animate-spin' : ''}`}></i>
          </div>
          <div>
            <h3 className="text-white text-[10px] font-black uppercase tracking-widest leading-none">{title || 'Noticias al Día'}</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-[7px] text-green-400 font-bold uppercase tracking-tighter">
                 {mode === 'carousel' ? 'Portales Locales' : 'Info Local'}
               </p>
               {isRefreshing && <span className="w-1.5 h-1.5 rounded-full bg-[#affc41] animate-ping"></span>}
            </div>
          </div>
        </div>
        
        {mode === 'carousel' && !isLoading && !error && newsItems.length > 0 && (
          <div className="flex gap-1">
            <button onClick={() => scroll('left')} className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all backdrop-blur-sm">
              <i className="fas fa-chevron-left text-[10px]"></i>
            </button>
            <button onClick={() => scroll('right')} className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all backdrop-blur-sm">
              <i className="fas fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        )}
      </div>

      {/* Contenido Flexible con Scroll */}
      <div className="flex-1 min-h-0 relative bg-slate-50/50 dark:bg-slate-900">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : newsItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {mode === 'carousel' ? (
              <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 p-6 snap-x snap-mandatory hide-scrollbar h-full items-center"
                style={{ scrollBehavior: 'smooth' }}
              >
                {newsItems.map((item, idx) => (
                  <div key={idx} className="snap-center h-full">
                    <NewsCard item={item} layout="card" />
                  </div>
                ))}
                <div className="w-4 flex-shrink-0"></div>
              </div>
            ) : mode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 h-full overflow-y-auto custom-scrollbar">
                 {newsItems.map((item, idx) => (
                    <NewsCard key={idx} item={item} layout="grid" />
                 ))}
              </div>
            ) : (
              // MODO LISTA (Usado en Home)
              <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                {newsItems.map((item, idx) => (
                   <NewsCard key={idx} item={item} layout="row" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default NewsFeed;
