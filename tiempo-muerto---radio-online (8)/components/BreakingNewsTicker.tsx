
import React, { useState, useEffect } from 'react';
import { getLocalNews } from '../services/geminiService';
import { getTickerNews, addTickerNews, subscribeToTickerNews, deleteTickerNews } from '../services/supabaseService';

interface TickerItem {
  id: number | string;
  text: string;
  source: 'manual' | 'ai' | 'default';
}

const BreakingNewsTicker: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([
    { id: 'def1', text: 'BIENVENIDOS A RADIO TIEMPO MUERTO', source: 'default' },
    { id: 'def2', text: 'LA MEJOR MÚSICA LAS 24 HORAS', source: 'default' },
    { id: 'def3', text: 'CONCEPCIÓN DEL URUGUAY ONLINE', source: 'default' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHeadline, setNewHeadline] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Cargar Noticias Manuales y Automáticas
  const fetchAllNews = async () => {
    let finalItems: TickerItem[] = [];

    // A. Manuales desde Supabase
    try {
      const manualData = await getTickerNews();
      const manualItems: TickerItem[] = manualData.map((d: any) => ({
        id: d.id,
        text: d.content,
        source: 'manual'
      }));
      finalItems = [...finalItems, ...manualItems];
    } catch (e) { console.error("Error fetching manual ticker:", e); }

    // B. Automáticas desde IA (Si hay pocas manuales)
    if (finalItems.length < 3) {
      try {
        const aiData = await getLocalNews('general');
        if (Array.isArray(aiData) && aiData.length > 0) {
          const aiItems: TickerItem[] = aiData.slice(0, 3).map((n, idx) => ({
            id: `ai-${idx}`,
            text: n.title,
            source: 'ai'
          }));
          finalItems = [...finalItems, ...aiItems];
        }
      } catch (e) { console.error("Error fetching AI ticker:", e); }
    }

    // C. GARANTÍA DE CONTENIDO: Si hay pocos items, rellenar con defaults
    if (finalItems.length < 3) {
        const defaults: TickerItem[] = [
            { id: 'def_b_1', text: 'SUMATE AL WHATSAPP DE LA RADIO', source: 'default' },
            { id: 'def_b_2', text: 'NOTICIAS Y BUENA MÚSICA', source: 'default' },
            { id: 'def_b_3', text: 'TIEMPO MUERTO ONLINE', source: 'default' }
        ];
        // Agregamos los defaults que hagan falta
        finalItems = [...finalItems, ...defaults.slice(0, 3 - finalItems.length)];
    }

    setItems(finalItems);
  };

  useEffect(() => {
    fetchAllNews();

    // Suscripción a cambios en DB
    const sub = subscribeToTickerNews(() => {
      fetchAllNews();
    });

    const interval = setInterval(fetchAllNews, 5 * 60 * 1000); // Refrescar cada 5 min
    return () => { sub.unsubscribe(); clearInterval(interval); };
  }, []);

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setIsModalOpen(true);
    } else {
      const pass = prompt("Contraseña de Producción:");
      if (pass === 'admin123') {
        setIsAdmin(true);
        setIsModalOpen(true);
      } else {
        alert("Acceso denegado.");
      }
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadline.trim()) return;
    await addTickerNews(newHeadline.toUpperCase());
    setNewHeadline('');
    alert("¡Titular agregado al aire!");
    fetchAllNews();
  };

  const handleDelete = async (id: number) => {
    if(window.confirm("¿Retirar este titular del aire?")) {
       await deleteTickerNews(id);
       fetchAllNews(); // Forzar refresh visual inmediato
    }
  };

  return (
    <>
      <div className="bg-[#b91c1c] w-full py-2 overflow-hidden whitespace-nowrap border-b-[3px] border-[#affc41] relative group shadow-md z-40">
        
        {/* Botón Admin */}
        <button 
           onClick={handleOpenAdmin}
           className="absolute right-0 top-0 bottom-0 w-8 bg-black/10 text-white/30 hover:text-white hover:bg-black/40 z-50 flex items-center justify-center transition-all cursor-pointer"
           title="Administrar Ticker"
        >
            <i className="fas fa-pen text-[8px]"></i>
        </button>

        {/* Contenedor de Animación */}
        <div className="flex animate-marquee-slow items-center">
          {[...items, ...items, ...items, ...items, ...items].map((item, i) => (
            <div key={`${item.id}-${i}`} className="flex items-center flex-shrink-0 mx-4 md:mx-8">
              
              <span className={`text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded mr-2 md:mr-3 uppercase tracking-tighter italic ${
                  item.source === 'manual' ? 'bg-[#affc41] text-[#b91c1c]' : 
                  item.source === 'default' ? 'bg-white text-[#b91c1c]' :
                  'bg-black/20 text-white'
                }`}>
                {item.source === 'manual' ? 'ÚLTIMO MOMENTO' : item.source === 'default' ? 'RADIO' : 'INFO'}
              </span>

              <span className="text-[11px] md:text-[13px] font-black text-white uppercase tracking-widest drop-shadow-sm">
                {item.text}
              </span>

              <span className="mx-4 md:mx-6 text-white/40 text-[10px]">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Carga de Noticias */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative border-4 border-[#b91c1c]">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors">
                  <i className="fas fa-times"></i>
              </button>

              <h3 className="text-xl font-black text-[#b91c1c] uppercase mb-4 flex items-center gap-2">
                 <i className="fas fa-satellite-dish"></i> Cargar Ticker Rojo
              </h3>

              <form onSubmit={handleAddNews} className="flex gap-2 mb-6">
                 <input 
                    autoFocus
                    value={newHeadline}
                    onChange={e => setNewHeadline(e.target.value)}
                    placeholder="Escriba el titular urgente aquí..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm font-bold uppercase"
                 />
                 <button type="submit" className="bg-[#b91c1c] text-white px-6 rounded-xl font-black uppercase text-xs hover:bg-red-700 transition-colors shadow-lg">
                    Subir
                 </button>
              </form>

              <div className="border-t border-slate-200 pt-4">
                 <h4 className="text-xs font-black text-slate-400 uppercase mb-3">Titulares Activos (Manuales)</h4>
                 <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {items.filter(i => i.source === 'manual').map((item) => (
                       <div key={item.id} className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
                          <span className="text-xs font-bold text-red-900 truncate mr-2">{item.text}</span>
                          <button 
                             onClick={() => handleDelete(item.id as number)}
                             className="text-red-500 hover:bg-white hover:shadow-sm p-1.5 rounded transition-all text-[10px] font-black uppercase"
                          >
                             <i className="fas fa-trash"></i> BORRAR
                          </button>
                       </div>
                    ))}
                    {items.filter(i => i.source === 'manual').length === 0 && (
                       <p className="text-xs text-slate-400 italic text-center py-2">No hay noticias manuales cargadas. Se muestra información por defecto.</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-marquee-slow {
          animation: marquee-slow 60s linear infinite; /* 60s para que sea legible */
          width: max-content;
          will-change: transform;
        }
        /* Pausar al pasar el mouse para leer */
        .group:hover .animate-marquee-slow {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

export default BreakingNewsTicker;
