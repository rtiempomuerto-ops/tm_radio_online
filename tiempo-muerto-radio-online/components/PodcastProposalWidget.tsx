
import React, { useState, useRef } from 'react';
import { submitPodcastProposal } from '../services/supabaseService';

const PodcastProposalWidget: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', topic: '', duration: '15' });
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.topic) return;
    setStatus('loading');
    try {
      await submitPodcastProposal({ ...formData, image });
      setStatus('success');
      setFormData({ name: '', email: '', topic: '', duration: '15' });
      setImage(null);
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      alert("Error al enviar propuesta.");
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 h-[450px] flex flex-col">
      <div className="bg-[#15803d] p-4 flex items-center gap-3 border-b border-green-800">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <i className="fas fa-podcast text-sm"></i>
        </div>
        <div>
          <h3 className="text-white text-[12px] font-black uppercase tracking-widest leading-none">Subí tu Podcast</h3>
          <p className="text-[9px] text-green-200 font-bold uppercase tracking-tighter mt-1">El aire es tuyo</p>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
             <i className="fas fa-check-circle text-[#15803d] text-5xl mb-4"></i>
             <p className="text-[14px] font-black text-[#15803d] uppercase">¡Propuesta Enviada!</p>
             <p className="text-[10px] text-slate-500 mt-2">Te contactaremos pronto.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
               <input required placeholder="Tu Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400" />
               <input required placeholder="Email / Tel" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400" />
            </div>
            
            <input required placeholder="Título del Programa" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="bg-slate-50 dark:bg-slate-800 p-3 text-[13px] rounded-2xl outline-none font-bold dark:text-white placeholder-slate-400" />
            
            {/* Image Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors relative overflow-hidden group"
            >
              {image ? (
                <>
                  <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Preview" />
                  <div className="relative z-10 bg-black/50 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase backdrop-blur-sm">Cambiar Carátula</div>
                </>
              ) : (
                <>
                  <i className="fas fa-image text-slate-300 text-2xl mb-2"></i>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Subir Carátula</span>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-[#15803d] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all hover:bg-green-800 shadow-lg mt-1">
              {status === 'loading' ? <i className="fas fa-circle-notch fa-spin"></i> : 'ENVIAR PROPUESTA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PodcastProposalWidget;
