
import React, { useState, useEffect } from 'react';
import { sendRadioGreeting, getGreetingsHistory, subscribeToGreetings } from '../services/supabaseService';

const GreetingsWall: React.FC = () => {
  const [userName, setUserName] = useState(localStorage.getItem('tiempo_muerto_user') || '');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !message.trim()) return;
    setIsSending(true);
    try {
      await sendRadioGreeting(userName, location, message);
      setMessage('');
      setStatus('success');
      localStorage.setItem('tiempo_muerto_user', userName);
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) { alert("Error al enviar."); } finally { setIsSending(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-[#b91c1c] h-[450px] flex flex-col transition-colors">
      {/* Encabezado ROJO */}
      <div className="bg-[#b91c1c] p-4 flex items-center gap-3 border-b border-red-800">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <i className="fas fa-bullhorn text-sm"></i>
        </div>
        <div>
          <h3 className="text-white text-[12px] font-black uppercase tracking-widest leading-none">Fogón de Saludos</h3>
          <p className="text-[9px] text-red-100 font-bold uppercase tracking-tighter mt-1">La voz de la comunidad</p>
        </div>
      </div>

      {/* Cuerpo BLANCO */}
      <div className="p-6 flex-1 flex flex-col">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
             <i className="fas fa-check-circle text-[#b91c1c] text-5xl mb-4 shadow-sm"></i>
             <p className="text-[14px] font-black text-[#b91c1c] uppercase">¡Saludo Colgado!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <input 
                required 
                placeholder="Nombre" 
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
                className="bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none font-black text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#b91c1c] transition-colors" 
              />
              <input 
                placeholder="Ubicación" 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                className="bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none font-black text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#b91c1c] transition-colors" 
              />
            </div>
            
            <textarea 
              required 
              placeholder="Escribí tu saludo..." 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              className="flex-1 bg-slate-50 dark:bg-slate-800 p-3.5 text-[13px] rounded-2xl outline-none resize-none font-bold text-slate-800 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-[#b91c1c] transition-colors" 
            />
            
            {/* Botón ROJO */}
            <button type="submit" disabled={isSending} className="w-full py-4 bg-[#b91c1c] text-white rounded-2xl font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all hover:bg-[#991b1b] shadow-lg shadow-red-900/20">
              {isSending ? <i className="fas fa-circle-notch fa-spin"></i> : 'COLGAR SALUDO'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GreetingsWall;
