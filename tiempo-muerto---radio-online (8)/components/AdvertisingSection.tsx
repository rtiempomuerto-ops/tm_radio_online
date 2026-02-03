
import React, { useState, useEffect, useRef } from 'react';
import { submitAdvertisement, getActiveAdvertisements } from '../services/supabaseService';
import { Advertisement } from '../types';

interface AdvertisingSectionProps {
  slot: string; // 'middle' | 'bottom'
}

const AdvertisingSection: React.FC<AdvertisingSectionProps> = ({ slot }) => {
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

  const slotsToRender = Array(3).fill(null).map((_, index) => {
    return activeAds[index] || null;
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {slotsToRender.map((ad, index) => (
          <div key={index} className="h-full min-h-[160px]">
            {ad ? (
              <div 
                 onClick={() => window.open(ad.target_url, '_blank')}
                 className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 bg-[#b91c1c] text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-20">Activo</div>
                
                {ad.image_url ? (
                   <img src={ad.image_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                ) : (
                  <div className="p-6 flex flex-col items-center text-center gap-2 h-full justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[#b91c1c] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-inner">
                        <i className={`fas ${ad.icon_key} text-2xl`}></i>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-base line-clamp-1">{ad.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ad.subtitle}</p>
                    <div className="mt-3 px-4 py-1.5 bg-[#b91c1c] text-white rounded-full text-[8px] font-black uppercase tracking-widest">Ver Oferta</div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
              </div>
            ) : (
              <div 
                  onClick={() => { setStep('form'); setIsModalOpen(true); }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-4 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-3 hover:border-[#b91c1c]/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group h-full"
              >
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 flex items-center justify-center mb-1 group-hover:text-[#b91c1c] group-hover:bg-red-50 transition-all group-hover:scale-110">
                      <i className="fas fa-bullhorn text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter text-sm group-hover:text-[#b91c1c]">Botón de Anuncio</h3>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Sumergí tu marca aquí</p>
                  </div>
                  <div className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest mt-1 group-hover:bg-[#b91c1c] transition-colors shadow-lg shadow-slate-900/10">
                      Reservar
                  </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl border-4 border-[#b91c1c] relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                <i className="fas fa-times"></i>
            </button>
            
            {step === 'form' ? (
              <>
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-[#b91c1c] uppercase tracking-tighter">Tu Marca en el Aire</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Crea tu botón publicitario en segundos</p>
                </div>
                <form onSubmit={handleInitiatePayment} className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center gap-4 shadow-inner">
                        {formData.image_url ? (
                           <img src={formData.image_url} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" alt="Preview" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-[#b91c1c] shadow-md border-2 border-white">
                              <i className={`fas ${formData.icon_key} text-2xl`}></i>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{formData.title || 'Título del Negocio'}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate tracking-widest">{formData.subtitle || '¿Qué ofrecés hoy?'}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Duración de Campaña</label>
                             <select 
                                value={formData.duration_days}
                                onChange={e => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black outline-none focus:border-[#b91c1c]"
                             >
                                 <option value={1}>1 Día ($2.000)</option>
                                 <option value={7}>1 Semana ($10.000)</option>
                                 <option value={30}>1 Mes ($35.000)</option>
                             </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Elegir Icono</label>
                            <div className="grid grid-cols-3 gap-2">
                                {icons.slice(0, 3).map(icon => (
                                    <button 
                                        key={icon.key}
                                        type="button"
                                        onClick={() => setFormData({...formData, icon_key: icon.key, image_url: ''})}
                                        className={`h-12 rounded-xl flex items-center justify-center text-sm transition-all ${formData.icon_key === icon.key ? 'bg-slate-900 text-[#affc41] scale-105 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    >
                                        <i className={`fas ${icon.key}`}></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                      <input required placeholder="NOMBRE DEL NEGOCIO" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#b91c1c]" maxLength={25} />
                      <input required placeholder="DESCRIPCIÓN CORTA" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#b91c1c]" maxLength={35} />
                      <input required type="url" placeholder="LINK WEB (FB / IG / WHATSAPP)" value={formData.target_url} onChange={e => setFormData({...formData, target_url: e.target.value})} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#b91c1c]" />
                    </div>

                    <div className="pt-2">
                        <label 
                           onClick={() => fileInputRef.current?.click()}
                           className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#b91c1c] cursor-pointer transition-colors uppercase tracking-widest"
                        >
                           <i className="fas fa-camera"></i>
                           {formData.image_url ? 'Cambiar Póster' : 'Subir Póster de Oferta'}
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        </label>
                    </div>

                    <button type="submit" className="w-full py-5 bg-[#b91c1c] text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-red-800 transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 mt-4 active:scale-95">
                        PAGAR ${getPrice(formData.duration_days).toLocaleString()} <i className="fas fa-arrow-right"></i>
                    </button>
                </form>
              </>
            ) : (
              <div className="text-center py-10 animate-fade-in">
                 <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner animate-pulse">
                    <i className="fas fa-check-circle"></i>
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">¡Casi Listo!</h3>
                 <p className="text-sm text-slate-500 font-bold px-6 leading-relaxed uppercase tracking-tight mb-8">
                   Una vez realizado el pago en MercadoPago, presione el botón de abajo para activar su anuncio.
                 </p>
                 <div className="space-y-4">
                   <button onClick={handleConfirmActivation} disabled={isSubmitting} className="w-full py-5 bg-[#15803d] text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3">
                       {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-bolt"></i> ACTIVAR ANUNCIO AHORA</>}
                   </button>
                   <button onClick={() => setStep('form')} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:underline">Volver a editar</button>
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
