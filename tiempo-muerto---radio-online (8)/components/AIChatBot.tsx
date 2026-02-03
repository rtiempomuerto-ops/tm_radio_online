
import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse, getFullLocalData } from '../services/geminiService';
import { processSongRequest } from '../services/radioBossService';
import { MateIcon } from './ContributionSection';

const AIChatBot: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [weather, setWeather] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'assistant', 
      content: '¡Buenas y santas, paisano! Soy Remanso, el asistente de Tiempo Muerto. ¿En qué le puedo ayudar hoy? ¿Quiere saber algo de la ciudad o cómo está el río? Aquí lo espero con el amargo listo.' 
    }]);

    const fetchWeather = async () => {
      const data = await getFullLocalData();
      if (data) setWeather(data);
    };
    fetchWeather();
    
    // CAMBIO: 60 MINUTOS (1 HORA)
    const interval = setInterval(fetchWeather, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getWeatherIcon = (condition: string) => {
    const conditionLower = (condition || '').toLowerCase();
    if (conditionLower.includes('lluvi') || conditionLower.includes('llov') || conditionLower.includes('agua')) return 'fa-cloud-showers-heavy';
    if (conditionLower.includes('nub') || conditionLower.includes('cubiert')) return 'fa-cloud';
    if (conditionLower.includes('soleado') || conditionLower.includes('despejado')) return 'fa-sun';
    return 'fa-cloud-sun';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    try {
      const response = await getChatResponse(input);
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Se me cortó el hilo de la charla, aparcero." }]);
    } catch (error) {
      // Mensaje genérico de error que no sea el JSON crudo
      setMessages(prev => [...prev, { role: 'assistant', content: '¡Ay juna! Parece que el operador se quedó dormido y no puedo comunicarme con la cabina ahora mismo. Pruebe de nuevo en un ratito, aparcero.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSongRequest = async () => {
    const requestedSong = input.trim();
    if (!requestedSong) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Vea paisano, primero escríbame qué tema quiere escuchar en el cuadro de texto y después apriete el botón rojo.' }]);
      return;
    }

    // Simulamos la interacción en el chat
    const userMsg = { role: 'user', content: `¡Pedido Musical!: ${requestedSong}` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Llamada real a la lógica de RadioBOSS y Supabase
      const result = await processSongRequest(requestedSong, '');
      
      let botResponse = "";
      if (result.success) {
        if (result.mode === 'auto') {
          // Mensaje de éxito automático
          botResponse = `¡Listo el pollo! El tema '${requestedSong}' ya entró al sistema de la radio. En cualquier momento sale al aire.`;
        } else {
          // Mensaje fallback manual
          botResponse = `El sistema automático está mañoso, pero no se preocupe: ya le dejé el papelito al operador con su pedido de '${requestedSong}'.`;
        }
      } else {
        // Mensaje de error
        botResponse = "¡Pucha digo! No pude comunicarme con la cabina. Pruebe de nuevo en un ratito, aparcero.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '¡Ay juna! Se me cortó la conexión con la radio. Intente más tarde.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-[#1e293b] rounded-[2.5rem] overflow-hidden border border-slate-700 shadow-2xl transition-all duration-500">
      {/* Encabezado con Widget de Clima */}
      <div className="bg-[#064e3b] p-5 flex items-center justify-between border-b border-green-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-[#affc41] shadow-sm text-[#064e3b]">
               <MateIcon className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#064e3b] rounded-full"></div>
          </div>
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest leading-none">Remanso AI</h3>
            <p className="text-[8px] text-[#affc41] font-bold uppercase tracking-tighter mt-1">Sintonía Entrerriana</p>
          </div>
        </div>
        
        {/* Mini Weather Widget */}
        <div className="bg-black/20 px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-white/10">
          <i className={`fas ${getWeatherIcon(weather?.current?.condition)} text-[#affc41] text-[10px]`}></i>
          <span className="text-white text-[11px] font-black">{weather?.current?.temp || '--'}°</span>
        </div>
      </div>

      {/* Caja de Mensajes - Fondo Gris Oscuro (Slate 700) en lugar de casi negro */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-700/50 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-md transition-all ${
              m.role === 'user' 
                ? 'bg-[#064e3b] text-white rounded-tr-none' 
                : 'bg-slate-600 text-slate-100 border border-slate-500 rounded-tl-none font-bold'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-[#affc41] text-[9px] font-black uppercase animate-pulse">
            <i className="fas fa-comment-dots"></i> Remanso está cebando una respuesta...
          </div>
        )}
      </div>

      {/* Entrada de texto - Fondo Gris Oscuro */}
      <div className="p-4 bg-slate-700 border-t border-slate-600 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Escriba su mensaje o tema aquí..."
            className="flex-1 bg-slate-800 text-white px-5 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#064e3b]/40 border border-slate-600 text-xs transition-all font-bold shadow-inner placeholder-slate-400"
          />
          <button 
            onClick={handleSend}
            className="w-12 h-12 bg-[#064e3b] hover:bg-[#053d2e] text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
        
        <button 
          onClick={handleSongRequest}
          className="w-full py-2.5 bg-[#b91c1c] hover:bg-red-800 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
        >
          <i className="fas fa-music"></i> PEDIR TEMA
        </button>
      </div>
    </div>
  );
};

export default AIChatBot;
