import { saveChatMessage, logSongRequest } from './supabaseService';

// Configuración de tu RadioBOSS
export const RB_IP = "miestacion.turadioonline.com.ar";
export const RB_PORT = "9000";
export const RB_PASS = "1";

export const getSonicPanelData = async () => {
  try {
    const url = "https://miestacion.turadioonline.com.ar/cp/get_info.php?p=8024";
    const response = await fetch(url);
    const data = await response.json();
    return {
      songTitle: data.title || "Radio Remanso",
      art: data.art || "",
      listeners: data.listeners || "0"
    };
  } catch (error) {
    return { songTitle: "Radio Remanso", art: "", listeners: "0" };
  }
};

export const getListenersCount = async () => {
  const data = await getSonicPanelData();
  return data.listeners;
};

// --- LÓGICA DE PEDIDOS (API RADIOBOSS + SUPABASE + CHAT FALLBACK) ---

export const processSongRequest = async (tema: string, notas: string = '') => {
  try {
    // 1. Intentamos inserción AUTOMÁTICA en RadioBOSS
    // Comando: inserttrack con pos=2 para ponerlo a continuación
    const safeTema = encodeURIComponent(tema);
    const apiUrl = `http://${RB_IP}:${RB_PORT}/inserttrack?pass=${RB_PASS}&pos=2&search=${safeTema}`;

    console.log("Intentando inserción automática en RadioBOSS:", apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); 

    const response = await fetch(apiUrl, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      // Registrar en DB Supabase como 'auto'
      await logSongRequest(tema, notas, 'auto');
      return { success: true, mode: 'auto', song: tema };
    } else {
      throw new Error(`RadioBOSS API Status: ${response.status}`);
    }

  } catch (error) {
    console.warn("Fallo conexión directa, enviando alerta al DJ por Chat y DB:", error);
    
    // 2. FALLBACK: Publicamos en Chat y DB como 'manual'
    try {
      await logSongRequest(tema, notas, 'manual');
      
      // Aviso visible en el chat para el operador
      await saveChatMessage(
        'SISTEMA-DJ', 
        `⚠️ NUEVO PEDIDO PENDIENTE: "${tema}" ${notas ? '('+notas+')' : ''}`, 
        null, 
        false
      );
    } catch (chatError) {
      console.error("Error enviando a chat/db:", chatError);
    }
    
    return { success: true, mode: 'manual', song: tema };
  }
};