
import React, { useState } from 'react';
import { processSongRequest } from '../services/radioBossService';

const RequestForm: React.FC = () => {
  const [song, setSong] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const result = await processSongRequest(song, notes);
    if (result.success) {
      setStatus('success');
      setSong(''); setNotes('');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-[#b91c1c] h-[450px] flex flex-col transition-colors">
      {/* Encabezado ROJO */}
      <div className="bg-[#b91c1c] p-4 flex items-center gap-3 border-b border-red-800">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <i className="fas fa-microphone-alt text-sm"></i>
        </div>
        <div>
          <h3 className="text-white text-[12px] font-black uppercase tracking-widest leading-none">Cabina de Pedidos</h3>
          <p className="text-[9px] text-red-100 font-bold uppercase tracking-tighter mt-1">Armamos la transmisión juntos</p>
        </div>
      </div>

      {/* Cuerpo BLANCO */}
      <div className="p-6 flex-1 flex flex-col">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
             <i className="fas fa-check-circle text-[#b91c1c] text-5xl mb-4 shadow-sm"></i>
             <p className="text-[14px] font-black text-[#b91c1c] uppercase">¡Pedido Recibido!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
            <input 
              required 
              value={song} 
              onChange={e => setSong(e.target.value)} 
              className="bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none font-black text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#b91c1c] transition-colors" 
              placeholder="Artista - Tema" 
            />
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none resize-none font-bold text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#b91c1c] transition-colors" 
              placeholder="Mensaje para el aire..." 
            />
            {/* Botón ROJO */}
            <button type="submit" disabled={status === 'loading'} className="w-full py-4 bg-[#b91c1c] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all hover:bg-[#991b1b] shadow-lg shadow-red-900/20">
              {status === 'loading' ? <i className="fas fa-circle-notch fa-spin"></i> : 'ENVIAR A CABINA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestForm;
