
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { NewsItem } from "../types";

// Configuración de la API y el modelo
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// Fix: Updated to recommended gemini-3-flash-preview model for general text tasks.
const GEMINI_MODEL = 'gemini-3-flash-preview'; 

// Tiempos de espera
const DURATIONS = {
  ONE_HOUR: 60 * 60 * 1000,
};

const CACHE_KEYS = {
  WEATHER: 'tm_weather_cache_v3', // Versión 3 para limpiar errores previos
  NEWS: 'tm_news_json_cache_v3'
};

/**
 * Guarda en el navegador
 */
const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn("Error guardando caché", e);
  }
};

/**
 * Revisa si tenemos datos guardados que todavía sirvan.
 */
const getFromCache = (key: string, maxAge = DURATIONS.ONE_HOUR) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const parsed = JSON.parse(cached);
    const isExpired = (Date.now() - parsed.timestamp) > maxAge;
    
    if (isExpired) {
      // Devolvemos la data pero marcamos que expiró
      return { ...parsed.data, isExpired: true, _raw: parsed.data }; 
    }
    // Datos frescos
    return parsed.data;
  } catch (e) {
    return null;
  }
};

/**
 * Recupera datos viejos del caché ignorando el tiempo de expiración
 * Útil cuando la API da error 429 (Cuota excedida)
 */
const getExpiredCache = (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
        const parsed = JSON.parse(cached);
        return parsed.data;
    } catch { return null; }
};

/**
 * EXTRACTOR DE JSON ROBUSTO
 */
const extractJson = (text: string): string => {
  if (!text) return "[]";
  const start = text.search(/[{\[]/);
  const firstCurly = text.indexOf('{');
  const firstSquare = text.indexOf('[');
  let startIndex = -1;
  
  if (firstCurly !== -1 && firstSquare !== -1) {
    startIndex = Math.min(firstCurly, firstSquare);
  } else if (firstCurly !== -1) {
    startIndex = firstCurly;
  } else if (firstSquare !== -1) {
    startIndex = firstSquare;
  }

  if (startIndex === -1) return "[]";

  const lastCurly = text.lastIndexOf('}');
  const lastSquare = text.lastIndexOf(']');
  let endIndex = Math.max(lastCurly, lastSquare);

  if (endIndex === -1) return "[]";

  return text.substring(startIndex, endIndex + 1);
};

// --- FUNCIÓN DE NOTICIAS ---
export const getLocalNews = async (topic: string = 'general'): Promise<NewsItem[] | null> => {
  const cacheKey = CACHE_KEYS.NEWS + '_' + topic.replace(/\s+/g, '_').toLowerCase();
  
  // 1. Primero intentamos caché fresco (1 HORA)
  const cachedData = getFromCache(cacheKey, DURATIONS.ONE_HOUR);
  if (cachedData && !Array.isArray(cachedData) && !cachedData.isExpired) return cachedData;

  try {
    const prompt = `Actúa como un agregador de noticias.
    Busca en Google noticias ACTUALES (de las últimas 24 horas) para: "${topic}, Concepción del Uruguay, Entre Ríos".
    
    Fuentes prioritarias: 03442, La Pirámide, El Miércoles Digital, Diario La Calle, Diario Junio.
    
    Devuelve estrictamente un ARRAY JSON con 4 noticias.
    Formato: [{"title": "Titular", "source": "Medio", "url": "Enlace", "excerpt": "Resumen corto", "timestamp": "Hace X hs"}]
    NO escribas nada más que el JSON.`;

    // Fix: Updated to use ai.models.generateContent directly as per coding guidelines.
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1 
      }
    });

    // Fix: Accessed .text property directly as per guidelines (not a function).
    const text = response.text || "[]";
    const cleanJson = extractJson(text);
    
    let newsItems: any[] = [];
    try {
        newsItems = JSON.parse(cleanJson);
    } catch (parseError) {
        // Fallback silencioso a caché viejo si el JSON falla
        const oldData = getExpiredCache(cacheKey);
        return Array.isArray(oldData) ? oldData : [];
    }

    if (!Array.isArray(newsItems)) newsItems = [];

    const formattedNews: NewsItem[] = newsItems.map((item: any, index: number) => ({
      id: `ai_${Date.now()}_${index}`,
      title: item.title || "Noticia Local",
      excerpt: item.excerpt || "Sin resumen disponible.",
      category: 'local',
      timestamp: item.timestamp || "Hoy",
      author: item.source || 'Redacción',
      source: item.source || "Info Gral",
      url: item.url || "#"
    }));

    if (formattedNews.length > 0) {
        saveToCache(cacheKey, formattedNews);
        return formattedNews;
    } else {
        const oldData = getExpiredCache(cacheKey);
        return Array.isArray(oldData) ? oldData : [];
    }

  } catch (e: any) {
    // BLINDAJE CONTRA ERROR 429
    // Si hay error, devolvemos caché viejo SIEMPRE, sin lanzar error al front.
    const expiredData = getExpiredCache(cacheKey);
    if (Array.isArray(expiredData) && expiredData.length > 0) {
        return expiredData;
    }

    // Si no hay nada, devolvemos array vacío para que NO salga cartel rojo.
    return [];
  }
};

// --- FUNCIÓN DE CLIMA Y RÍO ---
export const getFullLocalData = async () => {
  // 1. Caché fresco (1 HORA)
  const cachedWeather = getFromCache(CACHE_KEYS.WEATHER, DURATIONS.ONE_HOUR);
  if (cachedWeather && !cachedWeather.isExpired) return { ...cachedWeather, isFromCache: true };

  try {
    const prompt = `
    Busca en Google: "Clima actual Concepción del Uruguay" y "Altura río Uruguay prefectura Concepción del Uruguay".
    
    Genera un JSON con los datos actuales. Si no encuentras un dato exacto, estima basado en el clima actual.
    
    Formato estricto:
    {
      "current": { "temp": "25", "condition": "Soleado", "humidity": "60%", "wind": "N 10km/h", "feelsLike": "27", "pressure": "1013 hPa", "uvIndex": "Alto" }, 
      "river": { "height": "2.10", "status": "Estacionario" }, 
      "forecast": [{"day": "Lun", "icon": "fa-sun", "min": 18, "max": 30}, {"day": "Mar", "icon": "fa-cloud", "min": 20, "max": 28}, {"day": "Mie", "icon": "fa-rain", "min": 15, "max": 22}]
    }`;
    
    // Fix: Updated to use ai.models.generateContent directly as per coding guidelines.
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    // Fix: Accessed .text property directly as per guidelines (not a function).
    const text = response.text || "{}";
    const cleanJson = extractJson(text);
    
    let data;
    try {
       data = JSON.parse(cleanJson);
    } catch (e) {
       // Fallback silencioso
       const oldData = getExpiredCache(CACHE_KEYS.WEATHER);
       if (oldData) return { ...oldData, isFromCache: true };
       throw new Error("Parse error");
    }
      
    if (data && data.current) {
      data.current.temp = String(data.current.temp).replace('°C','').replace('°','').trim();
      saveToCache(CACHE_KEYS.WEATHER, data);
      return { ...data, isFromCache: false };
    }
    
    const oldData = getExpiredCache(CACHE_KEYS.WEATHER);
    if (oldData) return { ...oldData, isFromCache: true };
    // Si no hay datos, devolvemos objeto vacío seguro, NO error
    return { current: { temp: '--' }, river: { height: '--' }, forecast: [] };

  } catch (e: any) {
    // BLINDAJE CONTRA ERROR 429 EN CLIMA
    const expiredData = getExpiredCache(CACHE_KEYS.WEATHER);
    if (expiredData) {
        return { ...expiredData, isFromCache: true };
    }
    
    // Retorno seguro para que la UI muestre "--" en lugar de explotar
    return { 
      current: { temp: '--', condition: 'Sin datos', humidity: '--', wind: '--', feelsLike: '--', pressure: '--', uvIndex: '--' }, 
      river: { height: '--', status: '--' },
      forecast: [],
      isFromCache: false,
      error: false // Ponemos error false para que no salga cartel rojo
    };
  }
};

// --- FUNCIÓN DE CHAT (REMANSO) ---
export const getChatResponse = async (prompt: string): Promise<GenerateContentResponse> => {
  try {
    // Fix: Updated to use ai.models.generateContent directly as per coding guidelines.
    return await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "Sos Remanso, el asistente de 'Tiempo Muerto Radio'. Respondé breve, amable y con modismos entrerrianos.",
      },
    });
  } catch (e: any) {
    // Si cuota excedida, respuesta amable simulada
    if (JSON.stringify(e).includes("429") || JSON.stringify(e).includes("quota")) {
         return { text: "¡Disculpe aparcero! Hay mucha gente charlando conmigo ahora y el sistema se saturó. Espere un ratito y volvemos a intentar." } as any;
    }
    return { text: "El satélite está con interferencia, paisano. Intente luego." } as any;
  }
};
