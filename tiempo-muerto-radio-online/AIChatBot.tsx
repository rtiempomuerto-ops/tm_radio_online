import React, { useState } from 'react';

const AIChatBot: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Buenas noches, chamigo! Soy Remanso AI. ¿En qué puedo ayudarte en la radio hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [estaBuscando, setEstaBuscando] = useState(false);

  // FUNCIÓN PARA HABLAR CON RADIOBOSS
  const consultarRadioBOSS = async (pedido: string) => {
    try {
      // Usamos los datos de tu captura: Puerto 9000 y Clave 1
      const url = `http://localhost:9000/api?pass=1&action=search&search=${encodeURIComponent(pedido)}`;
      const response = await fetch(url);
      const data = await response.text();

      if (data.includes('item')) {
        return "¡Lo encontré en el galpón de la radio! Ya te lo pongo en fila para que suene.";
      } else {
        return "Ese no lo encontré en el disco, paisano. ¿Querés probar con otro?";
      }
    } catch (error) {
      return "No me pude comunicar con el RadioBOSS. ¡Fijate si el programa está abierto!";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setEstaBuscando(true);

    // Si el usuario pide una canción o pregunta si está...
    let respuestaBot = "Copiado, paisano. ¿Qué más necesitás?";
    
    if (input.toLowerCase().includes('tenes') || input.toLowerCase().includes('pone')) {
      respuestaBot = await consultarRadioBOSS(input);
    }

    setMessages(prev => [...prev, { role: 'model', text: respuestaBot }]);
    setInput('');
    setEstaBuscando(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
      {/* Encabezado */}
      <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="font-black text-xs uppercase tracking-widest text-[#ff2d95]">Asistente Virtual</h3>
          <p className="text-xl font-bold">REMANSO AI</p>
        </div>
        <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      {/* Caja de Mensajes */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              m.role === 'user' 
                ? 'bg-[#ff2d95] text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {estaBuscando && <p className="text-[10px] text-slate-400 animate-bounce">Remanso está buscando en el disco...</p>}
      </div>

      {/* Entrada de texto */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input 
          className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3 outline-none text-slate-600"
          placeholder="Pedí un tema o preguntá algo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#ff2d95] transition-colors"
        >
          ENVIAR
        </button>
      </div>
    </div>
  );
};

export default AIChatBot;