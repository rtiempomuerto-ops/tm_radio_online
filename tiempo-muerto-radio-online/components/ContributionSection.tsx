
import React, { useState, useEffect } from 'react';
import { registerContribution } from '../services/supabaseService';

// Icono de Mate Paisano Mejorado (Calabaza + Virola + Bombilla)
export const MateIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7 11C7 11 5 13 5 16C5 19.3137 8.13401 22 12 22C15.866 22 19 19.3137 19 16C19 13 17 11 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="12" cy="11" rx="5" ry="1.5" stroke="currentColor" strokeWidth="2"/>
    <path d="M11 10L9 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 3L10 2L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ContributionProps {
  customTitle?: string;
}

const ContributionSection: React.FC<ContributionProps> = ({ customTitle }) => {
  const [userName, setUserName] = useState(localStorage.getItem('tiempo_muerto_user') || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'once' | 'monthly'>('once');
  const [successData, setSuccessData] = useState<{ name: string, label: string } | null>(null);

  // LINK DE MERCADO PAGO OFICIAL (Suscripción Invitá un Mate - $1000)
  const REAL_MATE_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=748f136d610e464ba0db04b5cd56b427';
  
  // LINK DE MERCADO PAGO OFICIAL (Mate con Bizcochos - $2000)
  const BIZCOCHOS_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=95e18a1e57fa4d5b9ddfb19ce4e90853';

  // LINK DE MERCADO PAGO OFICIAL (Gaseosa Fresca - $5000)
  const GASEOSA_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=3a4aa8a721d045d183cf554eed90360b';

  // LINK DE MERCADO PAGO OFICIAL (Sándwich y Gaseosa - $10000 / A voluntad)
  const COMBO_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=37d0477be7bc4a6cba0d5232b8735d11';

  const ONCE_LINKS: Record<string, { label: string, amount: number, icon: any, link: string }> = {
    yerba: { label: 'Invitá un Mate', amount: 1000, icon: <MateIcon className="w-8 h-8 text-emerald-800" />, link: REAL_MATE_LINK },
    bizcochos: { label: 'Mate con Bizcochos', amount: 2000, icon: <i className="fas fa-cookie-bite text-amber-600 text-2xl"></i>, link: BIZCOCHOS_LINK },
    gaseosa: { label: 'Gaseosa Fresca', amount: 5000, icon: <i className="fas fa-bottle-water text-blue-500 text-2xl"></i>, link: GASEOSA_LINK },
    combo: { label: 'Sándwich y Gaseosa', amount: 10000, icon: <i className="fas fa-utensils text-orange-500 text-2xl"></i>, link: COMBO_LINK }
  };

  const MONTHLY_LINKS: Record<string, { label: string, amount: number, icon: any, link: string }> = {
    socio_mate: { label: 'SOCIO MATE', amount: 1500, icon: <MateIcon className="w-8 h-8 text-emerald-600" />, link: REAL_MATE_LINK },
    socio_plata: { label: 'SOCIO PLATA', amount: 4500, icon: <i className="fas fa-medal text-slate-400 text-2xl"></i>, link: '' },
    socio_oro: { label: 'SOCIO ORO', amount: 15000, icon: <i className="fas fa-crown text-yellow-500 text-2xl"></i>, link: '' },
    socio_platino: { label: 'SOCIO PLATINO', amount: 30000, icon: <i className="fas fa-gem text-blue-500 text-2xl"></i>, link: '' }
  };

  const handleDonate = async (key: string, isMonthly: boolean) => {
    const item = isMonthly ? MONTHLY_LINKS[key] : ONCE_LINKS[key];
    
    // 1. VALIDACIÓN: Solo abrimos si el link existe y NO es un placeholder vacío o genérico
    if (!item.link || item.link === '' || item.link.includes('TU_LINK')) {
      alert(`¡Disculpe aparcero! El botón de "${item.label}" todavía no tiene el pago habilitado. Pruebe con las opciones de Mate, Bizcochos o Gaseosa.`);
      return;
    }

    // 2. IMPORTANTE: Abrir la ventana INMEDIATAMENTE para evitar bloqueo de popups.
    window.open(item.link, '_blank');
    
    // 3. Opcional: Pedir nombre para el registro después de abrir la ventana
    let name = userName.trim();
    if (!name) {
      const input = prompt("¡Gracias por su gauchada! Para saludarlo en el aire, ¿cuál es su nombre?");
      name = input ? input.trim() : "Anónimo";
      if (name !== "Anónimo") {
        setUserName(name);
        localStorage.setItem('tiempo_muerto_user', name);
      }
    }

    setIsProcessing(true);
    try {
      await registerContribution(name, isMonthly ? item.label : key, item.amount);
      setSuccessData({ name, label: item.label });
      setTimeout(() => setSuccessData(null), 15000);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-500">
      <div className="bg-[#064e3b] p-4 flex items-center justify-between border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-green-400">
            <i className="fas fa-hand-holding-dollar text-xs"></i>
          </div>
          <div>
            <h3 className="text-white text-[10px] font-black uppercase tracking-widest leading-none">{customTitle || 'Sostener la Radio'}</h3>
            <p className="text-[7px] text-green-400 font-bold uppercase tracking-tighter mt-1">Tu ayuda nos mantiene al aire</p>
          </div>
        </div>
        {successData && (
          <button onClick={() => setSuccessData(null)} className="text-white/40 hover:text-white transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        )}
      </div>

      <div className="p-5 relative min-h-[300px]">
        {successData ? (
          <div className="absolute inset-0 z-10 p-6 flex flex-col items-center justify-center text-center bg-[#affc41] animate-fade-in">
             <div className="mb-4 text-[#064e3b] scale-150 transform animate-bounce">
                <i className="fas fa-handshake text-5xl"></i>
             </div>
             <h2 className="text-2xl font-black text-[#064e3b] uppercase leading-tight mb-2 tracking-tighter">
                ¡GRACIAS, <br/> {successData.name.toUpperCase()}!
             </h2>
             <div className="bg-white/40 px-4 py-2 rounded-2xl border border-[#064e3b]/20 mb-4">
               <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest">
                  POR {successData.label.toUpperCase()}
               </p>
             </div>
             <p className="text-[12px] font-mono font-bold text-[#064e3b]/80 leading-relaxed italic border-t border-[#064e3b]/10 pt-4">
                "Usted es de los buenos, paisano. Ya lo estamos mencionando en el aire de la Histórica."
             </p>
             <button 
               onClick={() => setSuccessData(null)}
               className="mt-6 text-[8px] font-black text-[#064e3b] uppercase tracking-[0.3em] hover:underline"
             >
               VOLVER AL CORRAL
             </button>
          </div>
        ) : (
          <>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
              <button onClick={() => setMode('once')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === 'once' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-400'}`}>Aporte Único</button>
              <button onClick={() => setMode('monthly')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${mode === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400'}`}>Suscripción</button>
            </div>

            <div className={`grid grid-cols-2 gap-3 transition-opacity duration-300 ${isProcessing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {Object.entries(mode === 'once' ? ONCE_LINKS : MONTHLY_LINKS).map(([key, item]) => (
                <button 
                  key={key} 
                  onClick={() => handleDonate(key, mode === 'monthly')} 
                  className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all group relative overflow-hidden h-32 ${
                    !item.link ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-[#064e3b] hover:shadow-lg cursor-pointer'
                  }`}
                >
                  <div className="mb-2 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[8px] font-black text-slate-800 dark:text-white uppercase text-center leading-tight mb-1">{item.label}</span>
                  <span className="text-[14px] font-black text-[#064e3b] dark:text-green-400">${item.amount}</span>
                  {!item.link && <span className="absolute top-2 right-2 text-[6px] bg-slate-200 text-slate-500 px-1 rounded">PRONTO</span>}
                </button>
              ))}
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-20">
                <i className="fas fa-circle-notch fa-spin text-2xl text-[#064e3b]"></i>
              </div>
            )}

            <p className="text-[7px] text-slate-400 font-bold uppercase text-center mt-4 tracking-widest italic">● COMPARTIR HACE BIEN, PAISANO ●</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ContributionSection;
