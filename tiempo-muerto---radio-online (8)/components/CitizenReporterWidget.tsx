
import React, { useState, useRef } from 'react';
import { submitCitizenReport } from '../services/supabaseService';

const CitizenReporterWidget: React.FC = () => {
  const [name, setName] = useState(localStorage.getItem('tiempo_muerto_user') || '');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      // Limitar a máximo 3 imágenes en total
      const remainingSlots = 3 - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string].slice(0, 3));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !desc) return;
    setStatus('loading');
    try {
      localStorage.setItem('tiempo_muerto_user', name);
      // Enviamos array de imágenes
      await submitCitizenReport(name, title, desc, images);
      setStatus('success');
      setTitle(''); 
      setDesc(''); 
      setImages([]);
      // Mantenemos el nombre para futuros reportes
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      alert("Error al enviar reporte.");
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-[#15803d] h-[450px] flex flex-col">
      <div className="bg-[#15803d] p-4 flex items-center gap-3 border-b border-green-800">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <i className="fas fa-camera text-sm"></i>
        </div>
        <div>
          <h3 className="text-white text-[12px] font-black uppercase tracking-widest leading-none">Reportero Vecinal</h3>
          <p className="text-[9px] text-green-200 font-bold uppercase tracking-tighter mt-1">Lo que pasa en tu barrio</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
             <i className="fas fa-check-circle text-[#15803d] text-5xl mb-4"></i>
             <p className="text-[14px] font-black text-[#15803d] uppercase">¡Reporte Enviado!</p>
             <p className="text-[10px] text-slate-500 mt-2 px-6">Tu noticia está siendo revisada por producción antes de salir al aire.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
            
            <input 
              required 
              placeholder="Tu Nombre (Reportero)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none font-black text-slate-900 dark:text-white placeholder-slate-500 border border-slate-200 dark:border-slate-700 focus:border-[#15803d] transition-colors" 
            />

            <input 
              required 
              placeholder="¿Qué está pasando? (Título)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none font-black text-slate-900 dark:text-white placeholder-slate-500 border border-slate-200 dark:border-slate-700 focus:border-[#15803d] transition-colors" 
            />
            
            <textarea 
              required 
              placeholder="Contanos los detalles..." 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none resize-none font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400 min-h-[60px] border border-slate-200 dark:border-slate-700 focus:border-[#15803d] transition-colors" 
            />
            
            {/* Photo Upload Area */}
            <div className="flex gap-2 h-20">
              {/* Botón agregar (si hay espacio) */}
              {images.length < 3 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors gap-1 group"
                >
                  <i className="fas fa-camera text-slate-400 group-hover:text-[#15803d] transition-colors"></i>
                  <span className="text-[9px] font-black text-slate-500 uppercase leading-none text-center">
                    {images.length === 0 ? 'Adjuntar Fotos' : 'Agregar Más'}
                  </span>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                </div>
              )}

              {/* Previsualizaciones */}
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                   <img src={img} className="w-full h-full object-cover" alt={`Foto ${idx+1}`} />
                   <button 
                     type="button"
                     onClick={() => removeImage(idx)}
                     className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-red-600"
                   >
                     <i className="fas fa-times"></i>
                   </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-[#15803d] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all hover:bg-green-800 shadow-lg shadow-green-900/20 mt-1">
              {status === 'loading' ? <i className="fas fa-circle-notch fa-spin"></i> : 'ENVIAR NOTICIA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CitizenReporterWidget;
