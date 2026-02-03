
import React, { useState, useEffect, useRef } from 'react';
import { PodcastItem } from '../types';
import { submitPodcastProposal } from '../services/supabaseService';

const PodcastSection: React.FC = () => {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({ name: '', email: '', phone: '', topic: '', duration: '15' });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Aquí podrías cargar los podcasts aprobados desde Supabase también
    const initial: PodcastItem[] = [
      { id: 'p1', title: 'Historias de la Isla del Puerto', author: 'Juan Pérez', description: 'Un recorrido sonoro por los secretos de nuestra costa.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400', timestamp: new Date(), status: 'approved' },
      { id: 'p2', title: 'El Lobo en Primera Persona', author: 'Gimnasia Fans', description: 'Relatos de la tribuna del gigante de Entre Ríos.', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400', timestamp: new Date(), status: 'approved' }
    ];
    setPodcasts(initial);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitPodcastProposal({ ...proposalData, image: coverImage });
      setSubmitSuccess(true);
      setProposalData({ name: '', email: '', phone: '', topic: '', duration: '15' });
      setCoverImage(null);
      setTimeout(() => { setSubmitSuccess(false); setShowProposalForm(false); }, 5000);
    } catch (err) {
      alert("¡Ay juna! No se pudo enviar la propuesta. Revise la señal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Espacio <span className="text-[#b91c1c]">Podcast</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tu voz en el aire de Tiempo Muerto</p>
        </div>
        <button onClick={() => setShowProposalForm(!showProposalForm)} className="px-8 py-4 bg-[#15803d] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-green-800 transition-all flex items-center gap-3 shadow-lg shadow-green-900/10">
          <i className={`fas ${showProposalForm ? 'fa-times' : 'fa-microphone-alt'}`}></i>
          {showProposalForm ? 'CANCELAR SOLICITUD' : 'QUIERO MI PROGRAMA'}
        </button>
      </div>

      {showProposalForm && (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] animate-slide-down shadow-2xl relative overflow-hidden">
          {submitSuccess ? (
            <div className="text-center py-10 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 text-[#15803d] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm"><i className="fas fa-check-double"></i></div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">¡Propuesta en Revisión!</h3>
              <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">Su pedido ha quedado en el corral de producción. Lo contactaremos pronto, aparcero.</p>
            </div>
          ) : (
            <form onSubmit={handleProposalSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <input required className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none font-bold" placeholder="Tu Nombre Completo" value={proposalData.name} onChange={e => setProposalData({...proposalData, name: e.target.value})} />
                <input required type="email" className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none font-bold" placeholder="tuemail@ejemplo.com" value={proposalData.email} onChange={e => setProposalData({...proposalData, email: e.target.value})} />
                <input required type="tel" className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none font-bold" placeholder="+54 3442 ..." value={proposalData.phone} onChange={e => setProposalData({...proposalData, phone: e.target.value})} />
                
                {/* Image Upload Input */}
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors relative overflow-hidden group"
                >
                  {coverImage ? (
                    <img src={coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Cover Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <i className="fas fa-image text-2xl"></i>
                      <span className="text-[10px] font-black uppercase">Subir Carátula</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="space-y-5 flex flex-col h-full">
                <select className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none font-bold" value={proposalData.duration} onChange={e => setProposalData({...proposalData, duration: e.target.value})}>
                  <option value="5">Micro (5 min)</option><option value="15">Estándar (15 min)</option><option value="30">Máximo (30 min)</option>
                </select>
                <textarea required className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none resize-none" placeholder="Tema a tratar..." value={proposalData.topic} onChange={e => setProposalData({...proposalData, topic: e.target.value})} />
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#b91c1c] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : 'ENVIAR PARA REVISIÓN'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="pt-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 border-l-4 border-[#15803d] pl-4">Escuchá a la comunidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {podcasts.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="relative h-48 overflow-hidden"><img src={p.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
              <div className="p-6">
                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase leading-tight mb-1">{p.title}</h4>
                <p className="text-[9px] font-bold text-[#15803d] uppercase mb-4 tracking-widest">Por {p.author}</p>
                <audio controls className="w-full h-8 accent-[#b91c1c]"><source src={p.audioUrl} type="audio/mpeg" /></audio>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PodcastSection;
