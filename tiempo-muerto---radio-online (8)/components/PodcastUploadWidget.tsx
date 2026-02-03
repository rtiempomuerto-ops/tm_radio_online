
import React, { useState, useRef } from 'react';
import { submitPodcastProposal } from '../services/supabaseService';

const PodcastUploadWidget: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', topic: '', email: '' });
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.topic) return;
    
    setStatus('loading');
    
    try {
      await submitPodcastProposal({ 
        name: formData.name, 
        email: formData.email, 
        topic: formData.topic, 
        duration: 'N/A',
        filename: fileName 
      });

      setStatus('success');
      setFormData({ name: '', topic: '', email: '' });
      setFileName(null);
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err) {
      alert("Hubo un error al enviar los datos.");
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 h-[450px] flex flex-col">
      {/* Header Verde */}
      <div className="bg-[#15803d] p-4 flex items-center gap-3 border-b border-green-800">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <i className="fas fa-cloud-upload-alt text-sm"></i>
        </div>
        <div>
          <h3 className="text-white text-[12px] font-black uppercase tracking-widest leading-none">Subí tu Podcast</h3>
          <p className="text-[9px] text-green-200 font-bold uppercase tracking-tighter mt-1">
            <i className="fas fa-clock mr-1"></i> Contenido en Revisión
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in space-y-3">
             <div className="w-16 h-16 bg-green-100 text-[#15803d] rounded-full flex items-center justify-center text-2xl mb-2">
                <i className="fas fa-envelope-open-text"></i>
             </div>
             <div>
                <p className="text-[14px] font-black text-[#15803d] uppercase leading-none">¡Envío Exitoso!</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Referencia ID: #{Math.floor(Math.random()*10000)}</p>
             </div>
             
             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-[80%]">
                Su material ha sido notificado a producción. 
                <br/>
                <span className="font-bold text-[#15803d]">rtiempomuerto@gmail.com</span>
             </div>
             
             <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-2">
               Se le avisará cuando sea aprobado.
             </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
            
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-2.5 rounded-xl flex gap-2 items-start mb-1">
               <i className="fas fa-info-circle text-[#15803d] mt-0.5 text-[10px]"></i>
               <p className="text-[9px] text-green-800 dark:text-green-400 font-medium leading-tight">
                 Todo material queda sujeto a revisión antes de ser publicado en la sección Podcasts.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <input 
                 required 
                 placeholder="Tu Nombre" 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
                 className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400 focus:border-[#15803d] border border-transparent transition-colors" 
               />
               <input 
                 required 
                 type="email"
                 placeholder="Tu Email" 
                 value={formData.email} 
                 onChange={e => setFormData({...formData, email: e.target.value})} 
                 className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400 focus:border-[#15803d] border border-transparent transition-colors" 
               />
            </div>
            
            <input 
              required 
              placeholder="Tema Principal del Podcast" 
              value={formData.topic} 
              onChange={e => setFormData({...formData, topic: e.target.value})} 
              className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400 focus:border-[#15803d] border border-transparent transition-colors" 
            />
            
            {/* File Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors relative overflow-hidden group min-h-[80px]"
            >
              {fileName ? (
                <div className="flex flex-col items-center gap-1">
                   <i className="fas fa-file-audio text-[#15803d] text-xl"></i>
                   <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 px-4 text-center truncate w-48">{fileName}</span>
                   <span className="text-[8px] text-green-500 font-bold uppercase">Listo para enviar</span>
                </div>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt text-slate-300 text-2xl mb-1 group-hover:scale-110 transition-transform"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Adjuntar Audio (MP3)</span>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full py-3.5 bg-[#15803d] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all hover:bg-green-800 shadow-lg mt-1 flex items-center justify-center gap-2">
              {status === 'loading' ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-paper-plane"></i> ENVIAR A REVISIÓN</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PodcastUploadWidget;
