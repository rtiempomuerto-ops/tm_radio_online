import React, { useState, useEffect, useRef } from 'react';
import { saveChatMessage, getChatHistory, subscribeToChat, updateChatMessageStatus } from '../services/supabaseService';
import { ChatMessage } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [isNewsMode, setIsNewsMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [moderatorMode, setModeratorMode] = useState(false);
  const MODERATOR_PASSWORD = "admin123"; 

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      setIsLoadingHistory(true);
      const savedUser = localStorage.getItem('tiempo_muerto_user');
      if (savedUser) setUserName(savedUser);

      const history = await getChatHistory();
      setMessages(history);
      setIsLoadingHistory(false);
    };
    initChat();

    // Suscripción Realtime
    const channel = subscribeToChat((payload) => {
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => {
          // Evitar duplicados si el remitente es el mismo usuario (que ya lo insertó localmente por optimismo)
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg].slice(-50);
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedMsg = payload.new as ChatMessage;
        setMessages(prev => 
          prev.map(msg => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg))
        );
      } else if (payload.eventType === 'DELETE') {
         // Si se borra físicamente de la DB
         const oldId = (payload as any).old?.id;
         setMessages(prev => prev.filter(m => m.id !== oldId));
      }
    });

    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFormOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - selectedImages.length) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImages(prev => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentUserName = userName.trim();
    if (!currentUserName) {
      const name = prompt("¿Cómo te llamás, paisano?");
      if (name && name.trim()) {
        currentUserName = name.trim();
        setUserName(currentUserName);
        localStorage.setItem('tiempo_muerto_user', currentUserName);
      } else return;
    }

    if (!input.trim() && selectedImages.length === 0) return;
    
    setIsUploading(true);
    try {
      // Guardamos en Supabase
      await saveChatMessage(currentUserName, input, selectedImages, isNewsMode);
      
      setInput('');
      setSelectedImages([]);
      setIsFormOpen(false);
    } catch (error) {
      alert("¡Ay juna! Tuvimos un problema con la conexión. Intente de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleModeratorMode = () => {
    if (moderatorMode) {
      setModeratorMode(false);
    } else {
      const password = prompt("Ingrese la contraseña de moderador:");
      if (password === MODERATOR_PASSWORD) {
        setModeratorMode(true);
        alert("Modo moderador activado, patrón.");
      } else {
        alert("Esa no es la llave, aparcero.");
      }
    }
  };

  // Fixed newStatus parameter type to include 'visible' status which is required for line 175
  const handleModerate = async (messageId: number, newStatus: 'visible' | 'hidden' | 'deleted') => {
    if (!moderatorMode) return;
    try {
      await updateChatMessageStatus(messageId, newStatus);
    } catch (error) {
      alert("No se pudo aplicar la moderación.");
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-slate-900 rounded-[3rem] border border-blue-50 dark:border-slate-800 overflow-hidden shadow-2xl transition-all duration-500">
      <div className="p-5 border-b border-blue-50 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-800/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fas fa-comments text-blue-600 dark:text-blue-400"></i>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Fogón Digital</h3>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={toggleModeratorMode}
                className={`text-[8px] font-black px-2 py-1 rounded transition-all duration-300 ${moderatorMode ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
                {moderatorMode ? 'MODERADOR ON' : 'ADMIN'}
            </button>
            <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-1 rounded uppercase">En Vivo</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/50">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <i className="fas fa-circle-notch fa-spin text-xl"></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">Abriendo el corral...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">
            No hay nadie en el fogón todavía. ¡Sea el primero en saludar!
          </div>
        ) : (
          messages.map((msg) => {
            const isUserMessage = msg.user === userName;
            const isHidden = msg.status === 'hidden';
            const isDeleted = msg.status === 'deleted';

            if (!moderatorMode && (isHidden || isDeleted)) {
              return (
                <div key={msg.id} className="text-center text-slate-400 text-[10px] italic py-2 border-b border-slate-100 dark:border-slate-800">
                  {isDeleted ? 'Mensaje eliminado.' : 'Este mensaje fue retirado por moderación.'}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'} animate-fade-in group`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase">{msg.user}</span>
                  {moderatorMode && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleModerate(msg.id, isHidden ? 'visible' : 'hidden')} className="text-[7px] bg-slate-200 px-1 rounded hover:bg-blue-100">
                        {isHidden ? 'MOSTRAR' : 'OCULTAR'}
                      </button>
                      <button onClick={() => handleModerate(msg.id, 'deleted')} className="text-[7px] bg-red-100 text-red-600 px-1 rounded hover:bg-red-200">
                        BORRAR
                      </button>
                    </div>
                  )}
                </div>
                <div className={`max-w-[85%] rounded-2xl overflow-hidden shadow-sm border transition-all ${
                  isUserMessage 
                    ? 'bg-blue-600 text-white rounded-tr-none border-blue-500' 
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 rounded-tl-none'
                } ${isHidden ? 'opacity-40 grayscale' : ''} ${isDeleted ? 'opacity-20 line-through' : ''}`}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="grid grid-cols-1 gap-1">
                       {msg.images.map((img, idx) => (
                         <img key={idx} src={img} className="w-full max-h-48 object-cover" alt="Adjunto" />
                       ))}
                    </div>
                  )}
                  {msg.text && <div className="px-4 py-3 text-[12px] whitespace-pre-wrap">{msg.text}</div>}
                </div>
                <span className="text-[7px] text-slate-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-blue-50 dark:border-slate-800">
        {!isFormOpen ? (
          <button onClick={() => setIsFormOpen(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            <i className="fas fa-paper-plane mr-2"></i> Mandar un mensaje
          </button>
        ) : (
          <form onSubmit={sendMessage} className="animate-slide-up space-y-3">
            <div className="flex items-center justify-between mb-1">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nuevo Mensaje</label>
               <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>
            </div>
            
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="¿Qué cuenta la gente linda?" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs outline-none min-h-[80px] resize-none text-slate-700 dark:text-white focus:border-blue-500 transition-colors" 
            />
            
            {selectedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                    <button type="button" onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={selectedImages.length >= 3}
                className="w-12 h-12 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-camera"></i>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              
              <button 
                type="submit" 
                disabled={isUploading || (!input.trim() && selectedImages.length === 0)} 
                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95'
                }`}
              >
                {isUploading ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  <>PUBLICAR <i className="fas fa-paper-plane"></i></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;