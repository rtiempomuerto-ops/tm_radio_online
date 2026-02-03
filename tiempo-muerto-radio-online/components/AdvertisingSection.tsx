
import React, { useState, useEffect, useRef } from 'react';
import { submitAdvertisement, getActiveAdvertisements } from '../services/supabaseService';
import { Advertisement } from '../types';

interface AdvertisingSectionProps {
  slot: string; // 'middle' | 'bottom'
}

const AdvertisingSection: React.FC<AdvertisingSectionProps> = ({ slot }) => {
  // Ahora manejamos un array de anuncios
  const [activeAds, setActiveAds] = useState<Advertisement[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'payment'>('form');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    target_url: '',
    owner_email: '',
    icon_key: 'fa-store',
    image_url: '', 
    duration_days: 7
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MP_LINKS: Record<number, string> = {
    1: "https://link.mercadopago.com.ar/radiotiempomuerto/1dia", 
    7: "https://link.mercadopago.com.ar/radiotiempomuerto/1semana", 
    30: "https://link.mercadopago.com.ar/radiotiempomuerto/1mes" 
  };

  useEffect(() => {
    const loadAds = async () => {
      // Obtenemos los anuncios para este slot (hasta 3)
      const ads = await getActiveAdvertisements(slot);
      setActiveAds(ads);
    };
    loadAds();
    const interval = setInterval(loadAds, 60000);
    return () => clearInterval(interval);
  }, [slot]);

  const getPrice = (days: number) => {
    switch(days) {
      case 1: return 2000;
      case 7: return 10000;
      case 30: return 35000;
      default: return 0;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.target_url) {
      alert("Por favor complete los datos del anuncio.");
      return;
    }
    const link = MP_LINKS[formData.duration_days];
    window.open(link, '_blank');
    setStep('payment');
  };

  const handleConfirmActivation = async () => {
    setIsSubmitting(true);
    try {
      await submitAdvertisement(formData, slot);
      const newAds = await getActiveAdvertisements(slot);
      setActiveAds(newAds);
      alert("¡Pago confirmado! Su anuncio ha sido activado exitosamente.");
      setIsModalOpen(false);
      setStep('form');
      setFormData({ title: '', subtitle: '', target_url: '', owner_email: '', icon_key: 'fa-store', image_url: '', duration_days: 7 });
    } catch (error) {
      console.error(error);
      alert("Hubo un error al activar el anuncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const icons = [
    { key: 'fa-store', label: 'Tienda' },
    { key: 'fa-utensils', label: 'Comida' },
    { key: 'fa-car', label: 'Auto' },
    { key: 'fa-hammer', label: 'Servicio' },
    { key: 'fa-shirt', label: 'Ropa' },
    { key: 'fa-music', label: 'Evento' }
  ];

  // Renderizamos exactamente 3 espacios (Slots)
  // Mapeamos los anuncios activos a los espacios disponibles.
  // Si no hay anuncio en el índice i, mostramos el botón de "Anuncie Aquí".
  const slotsToRender = Array(3).fill(null).map((_, index) => {
    return activeAds[index] || null;
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slotsToRender.map((ad, index) => (
          <div key={index} className="h-full min-h-[140px]">
            {ad ? (
              // ANUNCIO ACTIVO
              <div 
                 onClick={() => window.open(ad.target_url, '_blank')}
                 className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden h-full"
              >
                <div className="absolute top-0 left-0 bg-[#affc41] text-[#064e3b] text-[8px] font-black px-2 py-1 rounded-br-xl uppercase tracking-widest z-20 shadow-sm">Publicidad</div>
                
                {ad.image_url ? (
                   <img src={ad.image_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={ad.title} />
                ) : (
                  <div className="p-5 flex flex-col items-center text-center gap-2 h-full justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 text-[#c1121f] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
                        <i className={`fas ${ad.icon_key} text-xl`}></i>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm line-clamp-2">{ad.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase line-clamp-2">{ad.subtitle}</p>
                    <div className="mt-auto w-full pt-2">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider group-hover:underline">VER MÁS <i className="fas fa-arrow-right ml-1"></i></span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ESPACIO DISPONIBLE (ANUNCIE AQUÍ)
              <div 
                  onClick={() => { setStep('form'); setIsModalOpen(true); }}
                  className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-[2rem] border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer group opacity-80 hover:opacity-100 h-full"
              >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-1 group-hover:text-[#affc41] group-hover:bg-slate-900 transition-colors">
                      <i className="fas fa-bullhorn"></i>
                  </div>
                  <h3 className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Espacio Disponible</h3>
                  <button className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest mt-2 hover:bg-[#c1121f] transition-colors shadow-lg shadow-slate-800/20">
                      Anuncie Aquí
                  </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                <i className="fas fa-times"></i>
            </button>
            
            {step === 'form' ? (
              <>
                <div className="text-center mb-6">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Cree su Anuncio</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Su marca en la radio, al instante.</p>
                </div>
                <form onSubmit={handleInitiatePayment} className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                        {formData.image_url ? (
                           <img src={formData.image_url} className="w-12 h-12 rounded-xl object-cover border border-slate-200" alt="Preview" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-[#c1121f] shadow-sm">
                              <i className={`fas ${formData.icon_key} text-lg`}></i>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{formData.title || 'Título de su Negocio'}</p>
                            <p className="text-[9px] text-slate-500 truncate">{formData.subtitle || 'Descripción breve...'}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400">Imagen / Póster (Opcional)</label>
                        <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors gap-2 text-slate-400 hover:text-slate-600"
                        >
                           <i className="fas fa-image"></i>
                           <span className="text-[10px] font-bold uppercase">{formData.image_url ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400">Icono (Si no hay img)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {icons.map(icon => (
                                    <button 
                                        key={icon.key}
                                        type="button"
                                        onClick={() => setFormData({...formData, icon_key: icon.key})}
                                        className={`h-8 rounded-lg flex items-center justify-center text-xs transition-colors ${formData.icon_key === icon.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        <i className={`fas ${icon.key}`}></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-slate-400">Duración</label>
                             <select 
                                value={formData.duration_days}
                                onChange={e => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                                className="w-full h-[76px] px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                             >
                                 <option value={1}>1 Día ($2.000)</option>
                                 <option value={7}>1 Semana ($10.000)</option>
                                 <option value={30}>1 Mes ($35.000)</option>
                             </select>
                        </div>
                    </div>
                    <input required placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none" maxLength={25} />
                    <input required placeholder="Subtítulo" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none" maxLength={35} />
                    <input required type="url" placeholder="Link Web (Facebook/Insta)" value={formData.target_url} onChange={e => setFormData({...formData, target_url: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none" />
                    
                    <button type="submit" className="w-full py-4 bg-[#affc41] text-[#064e3b] rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#9ef525] transition-colors shadow-lg flex items-center justify-center gap-2 mt-2">
                        IR A PAGAR ${getPrice(formData.duration_days)} <i className="fas fa-arrow-right"></i>
                    </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse"><i className="fas fa-wallet"></i></div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Completar Pago</h3>
                 <div className="space-y-3">
                   <button onClick={handleConfirmActivation} disabled={isSubmitting} className="w-full py-4 bg-[#15803d] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-green-800 transition-colors shadow-lg flex items-center justify-center gap-2">
                       {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-check"></i> YA REALICÉ EL PAGO</>}
                   </button>
                   <button onClick={() => handleInitiatePayment({ preventDefault: () => {} } as any)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-wide hover:bg-slate-200 transition-colors">Abrir MercadoPago nuevamente</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdvertisingSection;
